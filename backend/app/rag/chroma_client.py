"""
ChromaDB client singleton.

Uses embedded persistent mode for local dev (no Docker needed).
In production / Docker Compose, set CHROMA_USE_HTTP=true to switch to HttpClient.
"""
from __future__ import annotations

import logging
import os
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_chroma_client: Any = None

# Set CHROMA_USE_HTTP=true in .env to use Docker/remote ChromaDB
_USE_HTTP = os.getenv("CHROMA_USE_HTTP", "false").lower() == "true"
# Local persistent storage path for embedded mode
_CHROMA_PERSIST_PATH = os.getenv("CHROMA_PERSIST_PATH", "./chroma_data")


def get_chroma_client() -> Any:
    """
    Return the module-level ChromaDB client singleton.

    - Local dev (default):  embedded persistent client at ./chroma_data
    - Docker / production:  HttpClient at CHROMA_HOST:CHROMA_PORT
                            (set CHROMA_USE_HTTP=true in .env)
    """
    global _chroma_client
    if _chroma_client is None:
        try:
            import chromadb  # type: ignore[import]

            if _USE_HTTP:
                _chroma_client = chromadb.HttpClient(
                    host=settings.chroma_host,
                    port=settings.chroma_port,
                )
                logger.info(
                    "[chroma] Connected to ChromaDB HTTP at %s:%s",
                    settings.chroma_host,
                    settings.chroma_port,
                )
            else:
                _chroma_client = chromadb.PersistentClient(
                    path=_CHROMA_PERSIST_PATH,
                )
                logger.info(
                    "[chroma] Using embedded ChromaDB at %s", _CHROMA_PERSIST_PATH
                )
        except Exception as exc:
            logger.error("[chroma] Failed to initialize ChromaDB: %s", exc)
            raise
    return _chroma_client
