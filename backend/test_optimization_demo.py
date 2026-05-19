#!/usr/bin/env python3
"""
Demonstration of EternoMind's Prompt Optimization Pipeline.

Shows:
1. Original query
2. Retrieved memories from Hindsight
3. Retrieved RAG documents from ChromaDB
4. Optimized prompt with token reduction
5. Model selection based on complexity
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.optimization.prompt_optimizer import get_prompt_optimizer
from app.optimization.cascadeflow_router import get_cascadeflow_router


async def demo_optimization():
    """Run a full optimization pipeline demo."""
    print("\n" + "=" * 80)
    print("ETERNOMIND PROMPT OPTIMIZATION PIPELINE DEMO")
    print("=" * 80 + "\n")

    # === STEP 1: Original Query ===
    original_query = "explain machine learning algorithms"
    print(f"📝 ORIGINAL QUERY:\n   {original_query}\n")
    print(f"   Word count: {len(original_query.split())} words")
    print(f"   Char count: {len(original_query)} chars\n")

    # === STEP 2: Mock Retrieved Memories ===
    mock_memories = [
        {
            "content": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
            "relevance_score": 0.92,
            "memory_id": "mem_001"
        },
        {
            "content": "Supervised learning uses labeled training data to train models, while unsupervised learning finds patterns in unlabeled data.",
            "relevance_score": 0.87,
            "memory_id": "mem_002"
        },
        {
            "content": "Deep learning uses neural networks with multiple layers to automatically discover representations for detection or classification.",
            "relevance_score": 0.85,
            "memory_id": "mem_003"
        },
    ]

    print("💾 RETRIEVED MEMORIES (from Hindsight):")
    for i, mem in enumerate(mock_memories, 1):
        print(f"\n   [{i}] Score: {mem['relevance_score']:.2f}")
        print(f"       {mem['content'][:80]}...")
    print(f"\n   Total memory tokens (uncompressed): ~{sum(len(m['content'].split()) for m in mock_memories)} words\n")

    # === STEP 3: Mock Retrieved RAG Documents ===
    mock_rag_docs = [
        {
            "content": "Supervised learning algorithms include: (1) Linear Regression - for continuous predictions, (2) Logistic Regression - for classification, (3) Decision Trees - for interpretable decisions, (4) Random Forests - for robust predictions, (5) Support Vector Machines - for complex boundaries.",
            "score": 0.89,
            "doc_id": "doc_001"
        },
        {
            "content": "Unsupervised learning algorithms include: (1) K-Means Clustering - for grouping similar data points, (2) Hierarchical Clustering - for creating hierarchies, (3) Principal Component Analysis (PCA) - for dimensionality reduction, (4) Autoencoders - for feature learning.",
            "score": 0.86,
            "doc_id": "doc_002"
        },
    ]

    print("📚 RETRIEVED RAG DOCUMENTS (from ChromaDB):")
    for i, doc in enumerate(mock_rag_docs, 1):
        print(f"\n   [{i}] Relevance: {doc['score']:.2f}")
        print(f"       {doc['content'][:80]}...")
    print(f"\n   Total RAG tokens (uncompressed): ~{sum(len(d['content'].split()) for d in mock_rag_docs)} words\n")

    # === STEP 4: Optimize Prompt ===
    optimizer = get_prompt_optimizer()
    optimized_prompt, token_estimate = await optimizer.optimize(
        query=original_query,
        memories=mock_memories,
        rag_docs=mock_rag_docs,
    )

    print("✨ OPTIMIZED PROMPT:")
    print("─" * 80)
    print(optimized_prompt)
    print("─" * 80)
    print(f"\n   Word count: {len(optimized_prompt.split())} words")
    print(f"   Char count: {len(optimized_prompt)} chars")
    print(f"   Estimated tokens: {token_estimate}\n")

    # === STEP 5: Token Reduction Analysis ===
    # Calculate what tokens would be without optimization
    unoptimized_prompt = f"""You are EternoMind, a helpful AI assistant. Use the provided context to give accurate, concise answers. If context is insufficient, answer from general knowledge.

Relevant memory context:
{chr(10).join([f"- {m['content']}" for m in mock_memories])}

Reference documents:
{chr(10).join([f"[{i+1}] {d['content']}" for i, d in enumerate(mock_rag_docs)])}

User: {original_query}"""

    unoptimized_tokens = int(len(unoptimized_prompt.split()) * 1.3)
    reduction = unoptimized_tokens - token_estimate
    reduction_percent = (reduction / unoptimized_tokens * 100) if unoptimized_tokens > 0 else 0

    print("📊 TOKEN USAGE ANALYSIS:")
    print(f"   Unoptimized tokens: {unoptimized_tokens}")
    print(f"   Optimized tokens:   {token_estimate}")
    print(f"   Reduction:          {reduction} tokens ({reduction_percent:.1f}%)")
    print(f"   Savings:            ✅ {reduction_percent:.1f}% fewer tokens\n")

    # === STEP 6: Model Selection via cascadeflow ===
    router = get_cascadeflow_router()
    memory_hits = len(mock_memories)
    selected_model = await router.route(
        memory_hits=memory_hits,
        token_estimate=token_estimate,
    )

    print("🤖 MODEL ROUTING (cascadeflow):")
    print(f"   Memory hits: {memory_hits}")
    print(f"   Token estimate: {token_estimate}")
    print(f"   Task complexity: {'LOW (use small model)' if memory_hits >= 4 and token_estimate < 2000 else 'HIGH (use large model)'}")
    print(f"   Selected model: {selected_model}")

    if selected_model == "llama-3.1-8b-instant":
        print(f"   ✅ Using SMALL model (faster, cheaper, suitable for this task)")
    else:
        print(f"   ✅ Using LARGE model (more capable, handles complex tasks)")
    print()

    # === STEP 7: Summary ===
    print("=" * 80)
    print("📈 OPTIMIZATION SUMMARY")
    print("=" * 80)
    print(f"""
✅ Token Reduction:     {reduction_percent:.1f}% fewer tokens
✅ Model Optimization:  {selected_model}
✅ Context Relevance:   Top 3 memories + Top 2 documents selected
✅ Memory Efficiency:   Focused context reduces hallucinations
✅ Cost Reduction:      Fewer tokens = Lower API costs
✅ Speed Improvement:   Small model faster inference latency

Original approach:  {unoptimized_tokens} tokens → {selected_model == 'llama-3.3-70b-versatile' and 'LARGE model' or 'SMALL model'}
Optimized approach: {token_estimate} tokens → {selected_model}
""")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(demo_optimization())
