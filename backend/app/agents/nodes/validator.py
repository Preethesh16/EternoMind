"""
Step 9 — Validator node.

Checks the LLM response for quality. If it fails and retry_count < 1,
the graph routes back to llm_inference for one retry.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState

logger = logging.getLogger(__name__)

# Minimum acceptable response length (characters)
MIN_RESPONSE_LENGTH = 20

# Patterns that indicate a bad/empty response
BAD_RESPONSE_PATTERNS = [
    "i don't know",
    "i cannot",
    "i'm unable",
    "error:",
    "sorry, i",
]


async def validator_node(state: AgentState) -> AgentState:
    """
    Validate the LLM response.

    Sets validation_passed=True if the response meets quality criteria.
    The graph uses this flag to decide whether to retry llm_inference.
    """
    response = state.get("response_text", "")
    retry_count = state.get("retry_count", 0)

    passed = True

    # Check minimum length
    if len(response.strip()) < MIN_RESPONSE_LENGTH:
        logger.warning("[validator] Response too short (%d chars)", len(response))
        passed = False

    # Check for bad patterns (only on first attempt — don't loop forever)
    if passed:
        lower = response.lower()
        for pattern in BAD_RESPONSE_PATTERNS:
            if pattern in lower and retry_count == 0:
                logger.warning("[validator] Bad pattern detected: '%s'", pattern)
                passed = False
                break

    logger.info(
        "[validator] passed=%s retry_count=%d response_len=%d",
        passed,
        retry_count,
        len(response),
    )

    return {**state, "validation_passed": passed}
