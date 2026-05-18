"""
POST /api/v1/chat — SSE streaming chat endpoint.

Calls run_pipeline() and streams SSE events to the frontend.
After the pipeline completes, writes a row to interaction_logs.
"""
from __future__ import annotations

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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: str


def _sse_event(event_name: str, data: dict) -> str:
    """Format a single SSE event as per the wire protocol."""
    return f"event: {event_name}\ndata: {json.dumps(data)}\n\n"


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
        done               — final metrics after memory update
    """
    # Sanitize and validate input
    sanitized_message = validate_and_sanitize(request.message)

    pipeline_start = time.time()

    async def event_stream() -> AsyncGenerator[str, None]:
        collected_events: list[tuple[str, dict]] = []

        async def event_callback(event_name: str, data: dict) -> None:
            """Collect events and yield them to the SSE stream."""
            collected_events.append((event_name, data))
            yield_value = _sse_event(event_name, data)
            # We can't yield directly from a nested function, so we store
            # and yield below via a queue approach.

        # Use a list as a simple async queue
        event_queue: list[str] = []

        async def queuing_callback(event_name: str, data: dict) -> None:
            event_queue.append(_sse_event(event_name, data))

        # Run the pipeline — it calls queuing_callback for each event
        final_state = None
        pipeline_error = None

        try:
            # We need to interleave pipeline execution with SSE yielding.
            # Strategy: run pipeline in a task, drain the queue periodically.
            import asyncio

            pipeline_task = asyncio.create_task(
                run_pipeline(
                    session_id=request.session_id,
                    message=sanitized_message,
                    user_id=request.user_id,
                    event_callback=queuing_callback,
                )
            )

            # Drain the event queue while the pipeline runs
            while not pipeline_task.done():
                while event_queue:
                    yield event_queue.pop(0)
                await asyncio.sleep(0.01)

            # Drain any remaining events after pipeline completes
            while event_queue:
                yield event_queue.pop(0)

            final_state = await pipeline_task

        except Exception as exc:
            logger.error("[chat] Pipeline error: %s", exc)
            pipeline_error = str(exc)
            yield _sse_event("error", {"step": "pipeline", "message": pipeline_error})

        if final_state is not None:
            # Write interaction log to DB
            try:
                latency_ms = (time.time() - pipeline_start) * 1000

                # Get next interaction number for this session
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
                    "[chat] Logged interaction #%d for session=%s",
                    interaction_number,
                    request.session_id,
                )
            except Exception as db_exc:
                logger.error("[chat] Failed to write interaction log: %s", db_exc)
                db.rollback()

            # Emit done event
            yield _sse_event(
                "done",
                {
                    "total_tokens": (
                        final_state.get("token_count_input", 0)
                        + final_state.get("token_count_output", 0)
                    ),
                    "model": final_state.get("selected_model", "unknown"),
                    "latency_ms": round((time.time() - pipeline_start) * 1000, 1),
                    "memory_hits": final_state.get("memory_hits", 0),
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
