"""
POST /api/v1/chat — SSE streaming chat endpoint.

Calls run_pipeline() and streams SSE events to the frontend.
After the pipeline completes, writes a row to interaction_logs and emits the
final `done` event with the response text and metrics.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import InteractionLog
from app.runtime.pipeline import run_pipeline
from app.security.sanitizer import validate_and_sanitize
from app.utils.pricing import estimate_cost

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: str


def _sse_event(event_name: str, data: dict) -> str:
    """Format a single SSE event per the wire protocol."""
    return f"event: {event_name}\ndata: {json.dumps(data)}\n\n"


# Sentinel sent through the queue to signal "pipeline finished, no more events"
_QUEUE_DONE = object()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """
    Stream the AI pipeline response as Server-Sent Events.

    SSE event sequence:
        pipeline_step × N  — one per pipeline node as it starts
        token × M          — one per Groq token chunk
        done               — final metrics + complete response text + safety info
        error              — only if the pipeline crashed
    """
    sanitized_message, safety_score = validate_and_sanitize(request.message)
    pipeline_start = time.time()

    # asyncio.Queue is the proper primitive — gives us backpressure and a clean
    # producer/consumer pattern with no race conditions.
    event_queue: asyncio.Queue = asyncio.Queue()

    async def event_callback(event_name: str, data: dict) -> None:
        """Each node calls this (via state) to push an SSE event."""
        await event_queue.put(_sse_event(event_name, data))

    async def event_stream() -> AsyncGenerator[str, None]:
        # Start the pipeline as a background task — events stream into the queue
        async def _run() -> dict:
            try:
                final_state = await run_pipeline(
                    session_id=request.session_id,
                    message=sanitized_message,
                    user_id=request.user_id,
                    event_callback=event_callback,
                    safety_score=safety_score,
                )
                return final_state  # type: ignore[return-value]
            finally:
                # Always signal end-of-stream, even on error
                await event_queue.put(_QUEUE_DONE)

        pipeline_task = asyncio.create_task(_run())

        # Drain the queue until the pipeline signals it's finished
        while True:
            item = await event_queue.get()
            if item is _QUEUE_DONE:
                break
            yield item  # type: ignore[misc]

        # Pipeline is done — collect the final state
        final_state: dict = {}
        try:
            final_state = await pipeline_task
        except Exception as exc:
            logger.error("[chat] Pipeline error: %s", exc)
            yield _sse_event("error", {"step": "pipeline", "message": str(exc)})
            return

        # Write interaction_logs row
        try:
            latency_ms = (time.time() - pipeline_start) * 1000

            existing_count = (
                db.query(InteractionLog)
                .filter(InteractionLog.session_id == request.session_id)
                .count()
            )
            interaction_number = existing_count + 1

            log_entry = InteractionLog(
                session_id=request.session_id,
                user_id=request.user_id,
                interaction_number=interaction_number,
                token_count_input=final_state.get("token_count_input", 0),
                token_count_output=final_state.get("token_count_output", 0),
                model_used=final_state.get("selected_model", "unknown"),
                memory_hits=final_state.get("memory_hits", 0),
                latency_ms=latency_ms,
            )
            db.add(log_entry)
            db.commit()
            logger.info(
                "[chat] Logged interaction #%d for session=%s response_len=%d",
                interaction_number,
                request.session_id,
                len(final_state.get("response_text", "")),
            )
        except Exception as db_exc:
            logger.error("[chat] Failed to write interaction log: %s", db_exc)
            db.rollback()

        # Emit the `done` event — includes the full response_text so the
        # frontend can fall back to displaying it whole if streaming tokens
        # were missed (e.g., a model that doesn't actually stream chunks).
        input_tokens = final_state.get("token_count_input", 0)
        output_tokens = final_state.get("token_count_output", 0)
        model = final_state.get("selected_model", "unknown")
        estimated_cost = estimate_cost(model, input_tokens, output_tokens)
        
        yield _sse_event(
            "done",
            {
                "interaction_number": interaction_number,
                "total_tokens": input_tokens + output_tokens,
                "token_count_input": input_tokens,
                "token_count_output": output_tokens,
                "model": model,
                "latency_ms": round((time.time() - pipeline_start) * 1000, 1),
                "memory_hits": final_state.get("memory_hits", 0),
                "response_text": final_state.get("response_text", ""),
                "optimized_prompt": final_state.get("optimized_prompt", ""),
                "prompt_goal": final_state.get("prompt_goal", ""),
                "complexity_score": final_state.get("complexity_score", 3),
                "token_estimate": final_state.get("token_estimate", 0),
                "safety_score": final_state.get("safety_score", 50),
                "estimated_cost": round(estimated_cost, 6),
            },
        )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
