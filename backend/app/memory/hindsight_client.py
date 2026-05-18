"""
Hindsight persistent memory SDK wrapper.

All pipeline nodes use this single client. If the SDK raises for any reason,
the methods log the error and return safe defaults — the pipeline never blocks.
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class HindsightClient:
    """
    Thin async wrapper around the Hindsight SDK.

    Provides two operations used by the pipeline:
    - retrieve: fetch memories relevant to a query for a given user
    - update:   store a new query+response pair as a memory for a user
    """

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client: Any = None
        self._bank_id = "eternomind"
        self._initialized = False

    def _ensure_client(self) -> None:
        """Lazily initialize the Hindsight SDK client."""
        if self._initialized:
            return
        try:
            from hindsight_client import Hindsight  # type: ignore[import]

            self._client = Hindsight(
                base_url="https://api.hindsight.vectorize.io",
                api_key=self._api_key,
            )
            # Ensure the memory bank exists (idempotent)
            try:
                self._client.create_bank(
                    bank_id=self._bank_id,
                    name="EternoMind User Memories",
                )
            except Exception:
                # Bank already exists — that's fine
                pass
            self._initialized = True
            logger.info("[hindsight] Client initialized, bank_id=%s", self._bank_id)
        except ImportError:
            logger.warning(
                "[hindsight] hindsight-client package not installed — "
                "memory operations will be no-ops"
            )
            self._initialized = True  # Mark as initialized to avoid repeated attempts

    async def retrieve(self, user_id: str, query: str) -> list[dict]:
        """
        Fetch memories relevant to *query* for *user_id*.

        Returns a list of dicts:
            {"content": str, "relevance_score": float, "memory_id": str}

        Returns [] on any error so the pipeline can continue without memory.
        """
        try:
            self._ensure_client()
            if self._client is None:
                return []

            # The Hindsight SDK recall() method returns ranked memories
            results = self._client.recall(
                bank_id=self._bank_id,
                query=query,
                user_id=user_id,
                top_k=10,
            )

            memories: list[dict] = []
            for item in results:
                memories.append(
                    {
                        "content": getattr(item, "content", str(item)),
                        "relevance_score": float(getattr(item, "score", 0.5)),
                        "memory_id": str(getattr(item, "id", "")),
                    }
                )
            logger.info(
                "[hindsight] retrieve user=%s query='%.40s' → %d memories",
                user_id,
                query,
                len(memories),
            )
            return memories

        except Exception as exc:
            logger.error(
                "[hindsight] retrieve failed for user=%s: %s", user_id, exc
            )
            return []

    async def update(self, user_id: str, query: str, response: str) -> None:
        """
        Store the query+response pair as a new memory for *user_id*.

        Silently swallows errors — a failed memory write must never crash the pipeline.
        """
        try:
            self._ensure_client()
            if self._client is None:
                return

            content = f"Q: {query}\nA: {response}"
            self._client.retain(
                bank_id=self._bank_id,
                content=content,
                user_id=user_id,
            )
            logger.info(
                "[hindsight] update user=%s query='%.40s' stored",
                user_id,
                query,
            )
        except Exception as exc:
            logger.error(
                "[hindsight] update failed for user=%s: %s", user_id, exc
            )


# Module-level singleton — initialized at app startup via FastAPI lifespan
_hindsight_client: HindsightClient | None = None


def get_hindsight_client() -> HindsightClient:
    """Return the module-level singleton HindsightClient."""
    global _hindsight_client
    if _hindsight_client is None:
        _hindsight_client = HindsightClient(api_key=settings.hindsight_api_key)
    return _hindsight_client
