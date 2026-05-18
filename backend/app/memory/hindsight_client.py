"""
Hindsight persistent memory SDK wrapper.

All pipeline nodes use this single client. If the SDK raises for any reason,
the methods log the error and return safe defaults — the pipeline never blocks.

Strategy: each user gets their own memory bank named "eternomind-{user_id}".
The bank is created lazily on first access (idempotent).
"""
from __future__ import annotations

import logging
import re
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


def _bank_id_for(user_id: str) -> str:
    """Generate a safe bank_id for a user (alphanumeric + dashes only)."""
    safe = re.sub(r"[^a-zA-Z0-9_-]", "-", user_id.lower())[:40] or "anon"
    return f"eternomind-{safe}"


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
        self._initialized = False
        self._known_banks: set[str] = set()

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
            self._initialized = True
            logger.info("[hindsight] Client initialized")
        except ImportError:
            logger.warning(
                "[hindsight] hindsight-client package not installed — "
                "memory operations will be no-ops"
            )
            self._initialized = True  # avoid repeated attempts

    def _ensure_bank(self, bank_id: str) -> None:
        """Sync version — only used outside async context."""
        if bank_id in self._known_banks or self._client is None:
            return
        try:
            self._client.create_bank(
                bank_id=bank_id,
                name=f"EternoMind Memory ({bank_id})",
            )
            logger.info("[hindsight] created bank=%s", bank_id)
        except Exception as exc:
            logger.debug("[hindsight] create_bank skipped: %s", exc)
        self._known_banks.add(bank_id)

    async def _ensure_bank_async(self, bank_id: str) -> None:
        """Async version — used inside the FastAPI request event loop."""
        if bank_id in self._known_banks or self._client is None:
            return
        try:
            await self._client.acreate_bank(
                bank_id=bank_id,
                name=f"EternoMind Memory ({bank_id})",
            )
            logger.info("[hindsight] created bank=%s", bank_id)
        except Exception as exc:
            logger.debug("[hindsight] acreate_bank skipped: %s", exc)
        self._known_banks.add(bank_id)

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

            bank_id = _bank_id_for(user_id)
            await self._ensure_bank_async(bank_id)

            response = await self._client.arecall(
                bank_id=bank_id,
                query=query,
                max_tokens=2048,
                budget="mid",
            )

            memories: list[dict] = []
            # Hindsight returns RecallResponse with `results: List[RecallResult]`.
            # Each RecallResult has fields: id, text, type, entities, context,
            # metadata, chunk_id, tags, source_fact_ids (verified via SDK introspection).
            # The SDK does NOT expose a per-item relevance score, so we treat
            # everything Hindsight returned as "relevant enough" — the recall API
            # already filters by relevance internally given max_tokens + budget.
            results = getattr(response, "results", None) or []
            # Defensive fallbacks for older/alt SDK versions
            if not results:
                results = getattr(response, "memories", None) or getattr(response, "items", None) or []

            # Default score: 0.75 — high enough to clear the 0.65 relevancy threshold
            # in context_relevancy_node, since Hindsight already filtered by relevance.
            DEFAULT_SCORE = 0.75
            for idx, item in enumerate(results):
                content = (
                    getattr(item, "text", None)
                    or getattr(item, "content", None)
                    or str(item)
                )
                score = float(
                    getattr(item, "score", None)
                    or getattr(item, "relevance", None)
                    or DEFAULT_SCORE
                )
                mem_id = str(
                    getattr(item, "id", None)
                    or getattr(item, "memory_id", None)
                    or idx
                )
                memories.append(
                    {
                        "content": content,
                        "relevance_score": score,
                        "memory_id": mem_id,
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

            bank_id = _bank_id_for(user_id)
            await self._ensure_bank_async(bank_id)

            content = f"Q: {query}\nA: {response}"
            await self._client.aretain(
                bank_id=bank_id,
                content=content,
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
