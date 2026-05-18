"""
Pipeline entry point.

run_pipeline() is the single function called by the chat API endpoint.
It initializes AgentState, runs the LangGraph graph, and returns the final state.
"""
from __future__ import annotations

import logging
import time
from typing import Awaitable, Callable

from app.agents.graph import get_graph
from app.agents.state import AgentState

logger = logging.getLogger(__name__)

# Type alias for the SSE event callback
EventCallback = Callable[[str, dict], Awaitable[None]]

# Step names in pipeline order (used for pipeline_step SSE events)
PIPELINE_STEPS = [
    "memory_retrieval",
    "context_relevancy",
    "rag_retrieval",
    "prompt_optimizer",
    "model_router",
    "llm_inference",
    "validator",
    "memory_updater",
]


async def run_pipeline(
    session_id: str,
    message: str,
    user_id: str,
    event_callback: EventCallback,
) -> AgentState:
    """
    Execute the full EternoMind AI pipeline for one user message.

    Args:
        session_id:     The active chat session ID.
        message:        The user's raw message text.
        user_id:        The authenticated user's ID.
        event_callback: Async callable that receives (event_name, data_dict).
                        Called for pipeline_step and token events.

    Returns:
        The final AgentState after all nodes have executed.
    """
    start_ms = time.time() * 1000

    # Build initial state
    initial_state: AgentState = {
        "session_id": session_id,
        "user_id": user_id,
        "original_query": message,
        "retrieved_memories": [],
        "relevant_memories": [],
        "memory_hits": 0,
        "rag_documents": [],
        "optimized_prompt": "",
        "token_estimate": 0,
        "selected_model": "",
        "response_text": "",
        "token_count_input": 0,
        "token_count_output": 0,
        "validation_passed": False,
        "retry_count": 0,
        "pipeline_start_ms": start_ms,
        "_event_callback": event_callback,  # type: ignore[typeddict-unknown-key]
    }

    graph = get_graph()

    # Wrap each node to emit pipeline_step events
    # LangGraph streams node outputs — we intercept via astream_events
    final_state: AgentState = initial_state

    try:
        async for event in graph.astream_events(initial_state, version="v1"):  # type: ignore[attr-defined]
            kind = event.get("event", "")
            name = event.get("name", "")

            if kind == "on_chain_start" and name in PIPELINE_STEPS:
                await event_callback(
                    "pipeline_step",
                    {"step": name, "status": "running"},
                )

            if kind == "on_chain_end" and name == "memory_updater":
                # Capture final state from the last node output
                output = event.get("data", {}).get("output", {})
                if output:
                    final_state = {**final_state, **output}

    except Exception as exc:
        logger.error("[pipeline] Unhandled exception: %s", exc)
        await event_callback(
            "error",
            {"step": "pipeline", "message": str(exc)},
        )
        raise

    logger.info(
        "[pipeline] Complete — model=%s input_tokens=%d output_tokens=%d memory_hits=%d",
        final_state.get("selected_model", "unknown"),
        final_state.get("token_count_input", 0),
        final_state.get("token_count_output", 0),
        final_state.get("memory_hits", 0),
    )

    return final_state
