"""
Step 6 — Prompt Optimizer node.

Rewrites the query into a token-efficient prompt using relevant memories and RAG docs.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.optimization.prompt_optimizer import get_prompt_optimizer

logger = logging.getLogger(__name__)


async def prompt_optimizer_node(state: AgentState) -> AgentState:
    """Build the optimized prompt and estimate its token count."""
    logger.info(
        "[prompt_optimizer] memories=%d docs=%d",
        state["memory_hits"],
        len(state["rag_documents"]),
    )

    optimizer = get_prompt_optimizer()
    optimized_prompt, token_estimate = await optimizer.optimize(
        query=state["original_query"],
        memories=state["relevant_memories"],
        rag_docs=state["rag_documents"],
    )

    return {
        **state,
        "optimized_prompt": optimized_prompt,
        "token_estimate": token_estimate,
    }
