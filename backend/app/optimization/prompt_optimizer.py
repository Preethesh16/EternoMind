"""
Prompt Optimizer — compresses context to minimize token usage.

Strategy:
- Use only the top-3 most relevant memories (by relevance_score)
- Use only the top-2 RAG documents (by score)
- If memory coverage is high (>= 5 hits), compress context aggressively
- Always include: system role, compressed context, user query
- Token estimate: len(prompt.split()) * 1.3 (rough heuristic)
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are EternoMind, a helpful AI assistant. "
    "Use the provided context to give accurate, concise answers. "
    "If context is insufficient, answer from general knowledge."
)


class PromptOptimizer:
    """
    Rewrites the user query into a token-efficient prompt by injecting
    only the most relevant memories and RAG documents.
    """

    async def optimize(
        self,
        query: str,
        memories: list[dict],
        rag_docs: list[dict],
        groq_client: Any = None,
    ) -> tuple[str, int, str]:
        """
        Build an optimized prompt from the query, memories, and RAG docs.

        Args:
            query:       The original user query.
            memories:    List of memory dicts.
            rag_docs:    List of RAG doc dicts.
            groq_client: Optional AsyncGroq client to generate a 'goal' summary.

        Returns:
            (optimized_prompt, estimated_token_count, prompt_goal)
        """
        memory_hits = len(memories)
        aggressive = memory_hits >= 5

        # Sort and slice memories
        top_memories = sorted(
            memories, key=lambda m: m.get("relevance_score", 0.0), reverse=True
        )[:3]

        # Sort and slice RAG docs
        top_docs = sorted(
            rag_docs, key=lambda d: d.get("score", 0.0), reverse=True
        )[:2]

        parts: list[str] = [f"System: {SYSTEM_PROMPT}"]

        # Inject memory context
        if top_memories:
            if aggressive:
                # Aggressive compression: Surgical snippets (up to 120 chars, word-safe)
                mem_lines = []
                for m in top_memories:
                    content = m["content"].strip()
                    if len(content) > 120:
                        # Find last space before 120
                        idx = content.rfind(" ", 0, 120)
                        content = content[:idx] + "..." if idx > 0 else content[:117] + "..."
                    mem_lines.append(f"• {content}")
                parts.append("CONTEXT_MEMORIES:\n" + "\n".join(mem_lines))
            else:
                mem_lines = [
                    f"• {m['content'][:300].strip()}" for m in top_memories
                ]
                parts.append("RELEVANT_MEMORIES:\n" + "\n".join(mem_lines))

        # Inject RAG context
        if top_docs:
            doc_lines = []
            for i, d in enumerate(top_docs):
                content = d["content"].strip()
                if len(content) > 400:
                    idx = content.rfind(" ", 0, 400)
                    content = content[:idx] + "..." if idx > 0 else content[:397] + "..."
                doc_lines.append(f"[{i+1}] {content}")
            parts.append("REFERENCE_DOCS:\n" + "\n".join(doc_lines))

        parts.append(f"USER_QUERY: {query}")

        optimized_prompt = "\n\n".join(parts)
        # More accurate token estimate for Llama models (approx 0.75 words per token)
        # But split() * 1.3 is a safe upper bound. Let's use 1.2.
        token_estimate = int(len(optimized_prompt.split()) * 1.2)

        prompt_goal = "Synthesize an answer using relevant context."
        if groq_client:
            try:
                from app.config import settings
                # Quickly derive the goal of this prompt using the SMALL model
                goal_query = (
                    "Summarize the primary goal of this user request in ONE short phrase "
                    "(e.g. 'Retrieve technical steps' or 'Verify user name'). "
                    f"User Request: {query}"
                )
                goal_resp = await groq_client.chat.completions.create(
                    model=settings.groq_small_model,
                    messages=[{"role": "user", "content": goal_query}],
                    max_tokens=40,
                )
                prompt_goal = goal_resp.choices[0].message.content.strip().strip('"')
            except Exception as e:
                logger.warning("[prompt_optimizer] Goal extraction failed: %s", e)

        logger.info(
            "[prompt_optimizer] memories=%d docs=%d aggressive=%s tokens≈%d goal='%s'",
            len(top_memories),
            len(top_docs),
            aggressive,
            token_estimate,
            prompt_goal,
        )
        return optimized_prompt, token_estimate, prompt_goal


# Module-level singleton
_optimizer: PromptOptimizer | None = None


def get_prompt_optimizer() -> PromptOptimizer:
    """Return the module-level singleton PromptOptimizer."""
    global _optimizer
    if _optimizer is None:
        _optimizer = PromptOptimizer()
    return _optimizer
