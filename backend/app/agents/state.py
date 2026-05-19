"""
LangGraph AgentState — the shared state TypedDict passed between all pipeline nodes.
"""
from __future__ import annotations

from typing import TypedDict


class AgentState(TypedDict):
    # ── Input ────────────────────────────────────────────────────────────────
    session_id: str
    user_id: str
    original_query: str

    # ── Step 3: memory_retrieval ─────────────────────────────────────────────
    retrieved_memories: list[dict]

    # ── Step 4: context_relevancy ────────────────────────────────────────────
    relevant_memories: list[dict]
    memory_hits: int

    # ── Step 5: rag_retrieval ────────────────────────────────────────────────
    rag_documents: list[dict]

    # ── Step 6: prompt_optimizer ─────────────────────────────────────────────
    optimized_prompt: str
    token_estimate: int
    prompt_goal: str

    # ── Step 7: model_router ─────────────────────────────────────────────────
    selected_model: str

    # ── Step 8: llm_inference ────────────────────────────────────────────────
    response_text: str
    token_count_input: int
    token_count_output: int

    # ── Step 9: validator ────────────────────────────────────────────────────
    validation_passed: bool
    retry_count: int

    # ── Timing ───────────────────────────────────────────────────────────────
    pipeline_start_ms: float
