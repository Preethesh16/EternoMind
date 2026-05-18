"""
Step 7 — Model Router node.

Uses cascadeflow to decide which Groq model to use for this pipeline run.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.optimization.cascadeflow_router import get_cascadeflow_router

logger = logging.getLogger(__name__)


async def model_router_node(state: AgentState) -> AgentState:
    """Select the Groq model via cascadeflow routing."""
    logger.info(
        "[model_router] memory_hits=%d token_estimate=%d",
        state["memory_hits"],
        state["token_estimate"],
    )

    router = get_cascadeflow_router()
    selected_model = await router.route(
        memory_hits=state["memory_hits"],
        token_estimate=state["token_estimate"],
    )

    logger.info("[model_router] selected model=%s", selected_model)
    return {**state, "selected_model": selected_model}
