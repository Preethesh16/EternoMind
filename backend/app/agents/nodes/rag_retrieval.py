"""
Step 5 — RAG Retrieval node.

Performs ChromaDB similarity search for the user query.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.rag.retriever import get_retriever

logger = logging.getLogger(__name__)


async def rag_retrieval_node(state: AgentState) -> AgentState:
    """Retrieve the top-5 most similar documents from ChromaDB."""
    logger.info("[rag_retrieval] query='%.40s'", state["original_query"])

    retriever = get_retriever()
    docs = await retriever.similarity_search(
        query=state["original_query"],
        k=5,
    )

    logger.info("[rag_retrieval] retrieved %d documents", len(docs))
    return {**state, "rag_documents": docs}
