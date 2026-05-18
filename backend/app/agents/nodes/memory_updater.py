"""
Step 11 — Memory Updater node.

Writes the query+response pair back to Hindsight so future interactions
benefit from this session's context.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.memory.hindsight_client import get_hindsight_client

logger = logging.getLogger(__name__)


async def memory_updater_node(state: AgentState) -> AgentState:
    """Store the current interaction in Hindsight for future retrieval."""
    logger.info("[memory_updater] user=%s", state["user_id"])

    client = get_hindsight_client()
    await client.update(
        user_id=state["user_id"],
        query=state["original_query"],
        response=state["response_text"],
    )

    logger.info("[memory_updater] memory stored for user=%s", state["user_id"])
    return state
