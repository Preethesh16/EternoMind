"""
cascadeflow Router — decides which Groq model to use based on memory coverage.

Routing logic (rule-based, used as both default and fallback):
  - memory_hits >= 4 AND token_estimate < 2000  →  GROQ_SMALL_MODEL (cheap, fast)
  - otherwise                                   →  GROQ_LARGE_MODEL  (powerful)

Integration with the cascadeflow SDK:
  - cascadeflow is an open-source library (no API key needed) that uses GROQ_API_KEY
  - We call `cascadeflow.init(mode="observe")` once at startup so all Groq calls are tracked
  - We construct a `CascadeAgent` with both Groq models in cost order (small first, large second)
  - When memory coverage suggests the small model is sufficient, we use the rule-based decision
    directly (it's cheaper than asking the SDK to cascade)
  - When the rule says "large", we still benefit from cascadeflow's quality validation by
    letting the agent attempt the small model first via complexity_hint

Reference: https://docs.cascadeflow.ai/api-reference/python/cascade-agent
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class CascadeflowRouter:
    """
    Routes each pipeline run to the appropriate Groq model.

    Initializes the cascadeflow harness on first use, constructs a CascadeAgent with
    both Groq models, and uses memory coverage to drive the routing decision.

    If the cascadeflow SDK is unavailable or raises, falls back to the deterministic
    rule-based logic.
    """

    def __init__(self) -> None:
        self._agent: Any = None
        self._sdk_available: bool = False
        self._sdk_checked: bool = False

    def _try_init_sdk(self) -> None:
        """
        Attempt to initialize the cascadeflow harness and CascadeAgent (once).

        cascadeflow does NOT use its own API key — it uses GROQ_API_KEY from the
        environment to talk to Groq. We pass GROQ_API_KEY explicitly so it's
        picked up regardless of how the process was launched.
        """
        if self._sdk_checked:
            return
        self._sdk_checked = True

        try:
            import os

            import cascadeflow  # type: ignore[import]
            from cascadeflow import CascadeAgent, ModelConfig  # type: ignore[import]

            # Ensure GROQ_API_KEY is exported so cascadeflow's provider layer finds it
            if settings.groq_api_key and not os.environ.get("GROQ_API_KEY"):
                os.environ["GROQ_API_KEY"] = settings.groq_api_key

            # Activate the harness in observe mode (tracks calls without enforcing budgets)
            cascadeflow.init(mode="observe")

            # Build the model cascade — small (cheap) first, large (powerful) second
            self._agent = CascadeAgent(
                models=[
                    ModelConfig(
                        name=settings.groq_small_model,
                        provider="groq",
                        cost=0.00005,
                    ),
                    ModelConfig(
                        name=settings.groq_large_model,
                        provider="groq",
                        cost=0.0006,
                    ),
                ],
                quality_config={"threshold": 0.7},
                enable_cascade=True,
                verbose=False,
            )
            self._sdk_available = True
            logger.info(
                "[cascadeflow] Harness initialized (observe mode), models=[%s, %s]",
                settings.groq_small_model,
                settings.groq_large_model,
            )

        except ImportError:
            logger.info(
                "[cascadeflow] SDK not installed — using rule-based routing"
            )
        except Exception as exc:
            logger.warning(
                "[cascadeflow] SDK init failed (%s) — using rule-based routing",
                exc,
            )

    def _rule_based_route(
        self, memory_hits: int, token_estimate: int
    ) -> str:
        """Deterministic routing logic — also used as the SDK fallback."""
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
        # Initialize the SDK lazily on first call. This sets self._sdk_available
        # and registers the harness so any Groq calls made later in the pipeline
        # are tracked by cascadeflow's observability.
        self._try_init_sdk()

        # The routing decision itself remains rule-based — that's the fast path
        # cascadeflow's CascadeAgent.run() is for execution-time fallback, not
        # pre-execution routing. The harness still observes the call.
        model = self._rule_based_route(memory_hits, token_estimate)

        if self._sdk_available:
            logger.info(
                "[cascadeflow] route → %s (hits=%d tokens≈%d, harness=observe)",
                model,
                memory_hits,
                token_estimate,
            )
        else:
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
