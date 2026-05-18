"""
Pipeline entry point.

run_pipeline() is the single function called by the chat API endpoint.

Implementation note:
We do NOT use LangGraph's astream_events here — that approach had race
conditions with the chat endpoint's event queue (events were emitted but
the queue drain loop had already exited). Instead we run the nodes
sequentially ourselves and emit pipeline_step events directly. This gives us
deterministic ordering and lets each node call event_callback for token
streaming (used by llm_inference).

The conditional retry logic (validator → llm_inference) is preserved.
"""
from __future__ import annotations

import logging
import time
from typing import Awaitable, Callable

from app.agents.state import AgentState
from app.agents.nodes.memory_retrieval import memory_retrieval_node
from app.agents.nodes.context_relevancy import context_relevancy_node
from app.agents.nodes.rag_retrieval import rag_retrieval_node
from app.agents.nodes.prompt_optimizer import prompt_optimizer_node
from app.agents.nodes.model_router import model_router_node
from app.agents.nodes.llm_inference import llm_inference_node
from app.agents.nodes.validator import validator_node
from app.agents.nodes.memory_updater import memory_updater_node

logger = logging.getLogger(__name__)

EventCallback = Callable[[str, dict], Awaitable[None]]

MAX_RETRIES = 1


async def _run_step(
    name: str,
    node_fn,
    state: AgentState,
    event_callback: EventCallback,
) -> AgentState:
    """Emit a pipeline_step event then run the node, merging its output into state."""
    await event_callback("pipeline_step", {"step": name, "status": "running"})
    output = await node_fn(state)
    return {**state, **output}


async def run_pipeline(
    session_id: str,
    message: str,
    user_id: str,
    event_callback: EventCallback,
) -> AgentState:
    """Execute the full EternoMind AI pipeline for one user message."""
    start_ms = time.time() * 1000

    state: AgentState = {
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

    try:
        # Conceptual pre-step events for the UI (security middleware + langgraph entry)
        await event_callback("pipeline_step", {"step": "security", "status": "running"})
        await event_callback("pipeline_step", {"step": "langgraph", "status": "running"})

        # Linear steps 3-7 (Hindsight → relevance → RAG → optimize → route)
        state = await _run_step("memory_retrieval", memory_retrieval_node, state, event_callback)
        state = await _run_step("context_relevancy", context_relevancy_node, state, event_callback)
        state = await _run_step("rag_retrieval", rag_retrieval_node, state, event_callback)
        state = await _run_step("prompt_optimizer", prompt_optimizer_node, state, event_callback)
        state = await _run_step("model_router", model_router_node, state, event_callback)

        # Steps 8-9 with up to one retry on validation failure
        for attempt in range(MAX_RETRIES + 1):
            state = await _run_step("llm_inference", llm_inference_node, state, event_callback)
            state = await _run_step("validator", validator_node, state, event_callback)

            if state.get("validation_passed", True):
                break
            if attempt >= MAX_RETRIES:
                logger.warning("[pipeline] Validation failed after %d retries — proceeding", attempt)
                break

            logger.info("[pipeline] Validation failed — retry %d/%d", attempt + 1, MAX_RETRIES)
            state = {**state, "retry_count": state.get("retry_count", 0) + 1}

        # Conceptual "response" step — tokens already streamed during llm_inference
        await event_callback("pipeline_step", {"step": "response", "status": "running"})

        # Step 11 — write back to memory
        state = await _run_step("memory_updater", memory_updater_node, state, event_callback)

    except Exception as exc:
        logger.error("[pipeline] Unhandled exception: %s", exc, exc_info=True)
        await event_callback("error", {"step": "pipeline", "message": str(exc)})
        raise

    logger.info(
        "[pipeline] Complete — model=%s input=%d output=%d hits=%d resp_len=%d",
        state.get("selected_model", "unknown"),
        state.get("token_count_input", 0),
        state.get("token_count_output", 0),
        state.get("memory_hits", 0),
        len(state.get("response_text", "")),
    )

    return state
