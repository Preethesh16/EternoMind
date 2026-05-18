"""
LangGraph StateGraph definition for the EternoMind pipeline.

Steps 2-9 and 11 are implemented as async LangGraph nodes.
Step 10 (SSE streaming) is handled by the FastAPI chat endpoint.
"""
from __future__ import annotations

import logging

from langgraph.graph import END, StateGraph  # type: ignore[import]

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


def _should_retry(state: AgentState) -> str:
    """
    Conditional edge after the validator node.

    Returns:
        "llm_inference" — if validation failed and we haven't retried yet
        "memory_updater" — otherwise (pass or max retries reached)
    """
    if not state.get("validation_passed", True) and state.get("retry_count", 0) < 1:
        logger.info("[graph] Validation failed — retrying llm_inference")
        # Increment retry counter before routing back
        return "retry_llm"
    return "memory_updater"


async def _increment_retry(state: AgentState) -> AgentState:
    """Tiny node that bumps retry_count before re-running llm_inference."""
    return {**state, "retry_count": state.get("retry_count", 0) + 1}


def build_graph() -> object:
    """
    Construct and compile the EternoMind LangGraph StateGraph.

    Graph topology:
        memory_retrieval
            → context_relevancy
            → rag_retrieval
            → prompt_optimizer
            → model_router
            → llm_inference
            → validator
            → (conditional) retry_llm → llm_inference  (max 1 retry)
                           OR memory_updater
            → END
    """
    graph = StateGraph(AgentState)

    # Register all nodes
    graph.add_node("memory_retrieval", memory_retrieval_node)
    graph.add_node("context_relevancy", context_relevancy_node)
    graph.add_node("rag_retrieval", rag_retrieval_node)
    graph.add_node("prompt_optimizer", prompt_optimizer_node)
    graph.add_node("model_router", model_router_node)
    graph.add_node("llm_inference", llm_inference_node)
    graph.add_node("validator", validator_node)
    graph.add_node("retry_llm", _increment_retry)
    graph.add_node("memory_updater", memory_updater_node)

    # Linear edges
    graph.set_entry_point("memory_retrieval")
    graph.add_edge("memory_retrieval", "context_relevancy")
    graph.add_edge("context_relevancy", "rag_retrieval")
    graph.add_edge("rag_retrieval", "prompt_optimizer")
    graph.add_edge("prompt_optimizer", "model_router")
    graph.add_edge("model_router", "llm_inference")
    graph.add_edge("llm_inference", "validator")

    # Conditional edge: retry or proceed
    graph.add_conditional_edges(
        "validator",
        _should_retry,
        {
            "retry_llm": "retry_llm",
            "memory_updater": "memory_updater",
        },
    )
    graph.add_edge("retry_llm", "llm_inference")
    graph.add_edge("memory_updater", END)

    return graph.compile()


# Module-level compiled graph singleton
_compiled_graph: object | None = None


def get_graph() -> object:
    """Return the compiled LangGraph singleton."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
        logger.info("[graph] LangGraph pipeline compiled")
    return _compiled_graph
