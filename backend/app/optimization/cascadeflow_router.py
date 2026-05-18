"""
cascadeflow Router — decides which Groq model to use based on memory coverage.

Routing logic:
  - memory_hits >= 4 AND token_estimate < 2000  →  GROQ_SMALL_MODEL (cheap, fast)
  - otherwise                                   →  GROQ_LARGE_MODEL  (powerful)

Integrates with the cascadeflow SDK if available; falls back to rule-based logic.
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class CascadeflowRouter:
    """
    Routes each pipeline run to the appropriate Groq model.

    Tries to use the cascadeflow SDK first; if unavailable or if the SDK
    raises, falls back to the deterministic rule-based logic.
    """

    def __init__(self) -> None:
        self._sdk_client: Any = None
        self._sdk_available = False
        self._sdk_checked = False

    def _try_init_sdk(self) -> None:
        """Attempt to initialize the cascadeflow SDK (once)."""
        if self._sdk_checked:
            return
        self._sdk_checked = True
        try:
            import cascadeflow  # type: ignore[import]

            self._sdk_client = cascadeflow.Client(
                api_key=settings.cascadeflow_api_key
            )
            self._sdk_available = True
            logger.info("[cascadeflow] SDK initialized")
        except ImportError:
            logger.info(
                "[cascadeflow] SDK not installed — using rule-based routing"
            )
        except Exception as exc:
            logger.warning(
                "[cascadeflow] SDK init failed (%s) — using rule-based routing", exc
            )

    def _rule_based_route(
        self, memory_hits: int, token_estimate: int
    ) -> str:
        """Deterministic fallback routing logic."""
        if memory_hits >= 4 and token_estimate < 2000:
            return settings.groq_small_model
        return settings.groq_large_model

    async def route(self, memory_hits: int, token_estimate: int) -> str:
        """
        Select the Groq model for this pipeline run.

        Args:
            memory_hits:    Number of Hindsight memories that passed the relevancy filter.
            token_estimate: Estimated token count of the optimized prompt.

        Returns:
            Groq model name string (e.g. "llama3-8b-8192" or "llama3-70b-8192").
        """
        self._try_init_sdk()

        if self._sdk_available and self._sdk_client is not None:
            try:
                result = self._sdk_client.route(
                    context={
                        "memory_hits": memory_hits,
                        "token_estimate": token_estimate,
                        "small_model": settings.groq_small_model,
                        "large_model": settings.groq_large_model,
                    }
                )
                model = getattr(result, "model", None) or self._rule_based_route(
                    memory_hits, token_estimate
                )
                logger.info(
                    "[cascadeflow] SDK route → %s (hits=%d tokens≈%d)",
                    model,
                    memory_hits,
                    token_estimate,
                )
                return model
            except Exception as exc:
                logger.warning(
                    "[cascadeflow] SDK route failed (%s) — falling back to rules", exc
                )

        model = self._rule_based_route(memory_hits, token_estimate)
        logger.info(
            "[cascadeflow] rule-based route → %s (hits=%d tokens≈%d)",
            model,
            memory_hits,
            token_estimate,
        )
        return model


# Module-level singleton
_router: CascadeflowRouter | None = None


def get_cascadeflow_router() -> CascadeflowRouter:
    """Return the module-level singleton CascadeflowRouter."""
    global _router
    if _router is None:
        _router = CascadeflowRouter()
    return _router
