"""
Step 4 — Context Relevancy node.

Scores each retrieved memory and filters to those with relevance_score >= 0.65.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState

logger = logging.getLogger(__name__)

RELEVANCE_THRESHOLD = 0.65


async def context_relevancy_node(state: AgentState) -> AgentState:
    """Filter retrieved memories to only those above the relevance threshold."""
    logger.info("[context_relevancy] filtering %d memories", len(state["retrieved_memories"]))

    relevant = [
        m for m in state["retrieved_memories"]
        if m.get("relevance_score", 0.0) >= RELEVANCE_THRESHOLD
    ]

    logger.info(
        "[context_relevancy] %d/%d memories passed threshold %.2f",
        len(relevant),
        len(state["retrieved_memories"]),
        RELEVANCE_THRESHOLD,
    )

    return {
        **state,
        "relevant_memories": relevant,
        "memory_hits": len(relevant),
    }
