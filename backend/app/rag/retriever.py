"""
RAG retriever — document ingestion and similarity search via ChromaDB.
"""
from __future__ import annotations

import logging
import uuid

from app.rag.chroma_client import get_chroma_client

logger = logging.getLogger(__name__)

COLLECTION_NAME = "eternomind_documents"


class RAGRetriever:
    """
    Wraps ChromaDB collection operations for the EternoMind pipeline.

    Usage:
        retriever = RAGRetriever()
        await retriever.ingest(["doc text..."], [{"source": "demo"}])
        results = await retriever.similarity_search("attention mechanism", k=3)
    """

    def __init__(self) -> None:
        self._collection = None

    def _get_collection(self) -> object:
        """Lazily fetch or create the ChromaDB collection."""
        if self._collection is None:
            client = get_chroma_client()
            self._collection = client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info("[rag] Using collection '%s'", COLLECTION_NAME)
        return self._collection

    async def ingest(
        self,
        documents: list[str],
        metadatas: list[dict],
    ) -> None:
        """
        Upsert *documents* into the ChromaDB collection.

        Args:
            documents: List of raw text strings to embed and store.
            metadatas: Parallel list of metadata dicts (one per document).
        """
        if not documents:
            return

        collection = self._get_collection()
        ids = [str(uuid.uuid4()) for _ in documents]

        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )
        logger.info("[rag] Ingested %d documents into '%s'", len(documents), COLLECTION_NAME)

    async def similarity_search(
        self,
        query: str,
        k: int = 5,
    ) -> list[dict]:
        """
        Find the *k* most similar documents to *query*.

        Returns a list of dicts:
            {"content": str, "score": float, "metadata": dict}

        Returns [] if ChromaDB is unavailable or the collection is empty.
        """
        try:
            collection = self._get_collection()
            results = collection.query(
                query_texts=[query],
                n_results=min(k, max(collection.count(), 1)),
                include=["documents", "distances", "metadatas"],
            )

            docs: list[dict] = []
            documents_list = results.get("documents", [[]])[0]
            distances_list = results.get("distances", [[]])[0]
            metadatas_list = results.get("metadatas", [[]])[0]

            for doc, dist, meta in zip(documents_list, distances_list, metadatas_list):
                # ChromaDB cosine distance: 0 = identical, 2 = opposite
                # Convert to similarity score in [0, 1]
                score = max(0.0, 1.0 - (dist / 2.0))
                docs.append({"content": doc, "score": score, "metadata": meta or {}})

            logger.info(
                "[rag] similarity_search query='%.40s' k=%d → %d results",
                query,
                k,
                len(docs),
            )
            return docs

        except Exception as exc:
            logger.error("[rag] similarity_search failed: %s", exc)
            return []


# Module-level singleton
_retriever: RAGRetriever | None = None


def get_retriever() -> RAGRetriever:
    """Return the module-level singleton RAGRetriever."""
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever
