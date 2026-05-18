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
    ) -> tuple[str, int]:
        """
        Build an optimized prompt from the query, memories, and RAG docs.

        Args:
            query:    The original user query.
            memories: List of memory dicts with 'content' and 'relevance_score'.
            rag_docs: List of RAG doc dicts with 'content' and 'score'.

        Returns:
            (optimized_prompt, estimated_token_count)
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
                # Aggressive compression: one-line summaries
                mem_lines = [
                    f"- {m['content'][:120].strip()}" for m in top_memories
                ]
                parts.append("Prior context (compressed):\n" + "\n".join(mem_lines))
            else:
                mem_lines = [
                    f"- {m['content'][:300].strip()}" for m in top_memories
                ]
                parts.append("Relevant memory context:\n" + "\n".join(mem_lines))

        # Inject RAG context
        if top_docs:
            doc_lines = [
                f"[{i+1}] {d['content'][:400].strip()}"
                for i, d in enumerate(top_docs)
            ]
            parts.append("Reference documents:\n" + "\n".join(doc_lines))

        parts.append(f"User: {query}")

        optimized_prompt = "\n\n".join(parts)
        token_estimate = int(len(optimized_prompt.split()) * 1.3)

        logger.info(
            "[prompt_optimizer] memories=%d docs=%d aggressive=%s tokens≈%d",
            len(top_memories),
            len(top_docs),
            aggressive,
            token_estimate,
        )
        return optimized_prompt, token_estimate


# Module-level singleton
_optimizer: PromptOptimizer | None = None


def get_prompt_optimizer() -> PromptOptimizer:
    """Return the module-level singleton PromptOptimizer."""
    global _optimizer
    if _optimizer is None:
        _optimizer = PromptOptimizer()
    return _optimizer
