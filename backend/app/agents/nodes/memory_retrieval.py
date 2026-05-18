"""
Step 3 — Memory Retrieval node.

Fetches memories from Hindsight for the current user and query.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.memory.hindsight_client import get_hindsight_client

logger = logging.getLogger(__name__)


async def memory_retrieval_node(state: AgentState) -> AgentState:
    """Retrieve all potentially relevant memories from Hindsight."""
    logger.info("[memory_retrieval] user=%s query='%.40s'", state["user_id"], state["original_query"])

    client = get_hindsight_client()
    memories = await client.retrieve(
        user_id=state["user_id"],
        query=state["original_query"],
    )

    return {**state, "retrieved_memories": memories}
