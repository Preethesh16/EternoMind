"""
Step 6 — Prompt Optimizer node.

Rewrites the query into a token-efficient prompt using relevant memories and RAG docs.
"""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.optimization.prompt_optimizer import get_prompt_optimizer

logger = logging.getLogger(__name__)


async def prompt_optimizer_node(state: AgentState) -> AgentState:
    """Build the optimized prompt and estimate its token count."""
    logger.info(
        "[prompt_optimizer] memories=%d docs=%d",
        state["memory_hits"],
        len(state["rag_documents"]),
    )

    from groq import AsyncGroq
    from app.config import settings
    client = AsyncGroq(api_key=settings.groq_api_key)

    optimizer = get_prompt_optimizer()
    optimized_prompt, token_estimate, prompt_goal, complexity_score = await optimizer.optimize(
        query=state["original_query"],
        memories=state["relevant_memories"],
        rag_docs=state["rag_documents"],
        groq_client=client,
    )

    event_callback = state.get("_event_callback")
    if event_callback:
        await event_callback("pipeline_step", {
            "step": "prompt_optimizer", 
            "status": "complete",
            "optimized_prompt": optimized_prompt,
            "prompt_goal": prompt_goal,
            "complexity_score": complexity_score,
            "token_estimate": token_estimate
        })

    return {
        **state,
        "optimized_prompt": optimized_prompt,
        "token_estimate": token_estimate,
        "prompt_goal": prompt_goal,
        "complexity_score": complexity_score,
    }
