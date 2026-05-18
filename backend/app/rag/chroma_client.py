"""
ChromaDB client singleton.

Connects to the ChromaDB server at settings.chroma_host:settings.chroma_port.
All RAG operations go through this single client instance.
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_chroma_client: Any = None


def get_chroma_client() -> Any:
    """
    Return the module-level ChromaDB HttpClient singleton.

    Lazily initialized on first call so the import doesn't fail if chromadb
    isn't installed yet (e.g. during unit tests that mock this module).
    """
    global _chroma_client
    if _chroma_client is None:
        try:
            import chromadb  # type: ignore[import]

            _chroma_client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
            )
            logger.info(
                "[chroma] Connected to ChromaDB at %s:%s",
                settings.chroma_host,
                settings.chroma_port,
            )
        except Exception as exc:
            logger.error("[chroma] Failed to connect to ChromaDB: %s", exc)
            raise
    return _chroma_client
