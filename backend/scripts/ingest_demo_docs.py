"""
Ingest demo documents into ChromaDB for the EternoMind RAG pipeline.

Run once before the demo:
    cd backend
    python scripts/ingest_demo_docs.py
"""
from __future__ import annotations

import asyncio
import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DEMO_DOCUMENTS = [
    (
        "Transformer architecture uses self-attention mechanisms to process sequences in parallel. "
        "Unlike RNNs, transformers don't process tokens sequentially — they compute attention scores "
        "between all token pairs simultaneously, enabling much faster training on modern GPUs.",
        {"source": "transformer_overview", "topic": "transformers"},
    ),
    (
        "Multi-head attention splits the embedding dimension into multiple 'heads', each learning "
        "different types of relationships. For example, one head might focus on syntactic dependencies "
        "while another captures semantic similarity. The outputs are concatenated and projected back.",
        {"source": "multi_head_attention", "topic": "attention"},
    ),
    (
        "The attention formula is: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V. "
        "Q (query), K (key), and V (value) are linear projections of the input. "
        "The scaling factor sqrt(d_k) prevents vanishing gradients in the softmax.",
        {"source": "attention_formula", "topic": "attention"},
    ),
    (
        "Positional encoding adds information about token position to the embeddings since "
        "transformers have no inherent notion of order. The original paper uses sinusoidal "
        "functions: PE(pos, 2i) = sin(pos/10000^(2i/d_model)).",
        {"source": "positional_encoding", "topic": "transformers"},
    ),
    (
        "BERT (Bidirectional Encoder Representations from Transformers) uses only the encoder "
        "stack of the transformer. It's pre-trained with masked language modeling (MLM) and "
        "next sentence prediction (NSP), then fine-tuned for downstream tasks.",
        {"source": "bert_overview", "topic": "bert"},
    ),
    (
        "GPT models use only the decoder stack with causal (left-to-right) attention masking. "
        "This autoregressive design means each token can only attend to previous tokens, "
        "making GPT naturally suited for text generation tasks.",
        {"source": "gpt_overview", "topic": "gpt"},
    ),
    (
        "The feed-forward network (FFN) in each transformer layer applies two linear transformations "
        "with a ReLU activation: FFN(x) = max(0, xW1 + b1)W2 + b2. The inner dimension is typically "
        "4x the model dimension, acting as a key-value memory store.",
        {"source": "ffn_layer", "topic": "transformers"},
    ),
    (
        "Layer normalization is applied before (pre-norm) or after (post-norm) each sub-layer in "
        "modern transformers. Pre-norm (used in GPT-2 and later) improves training stability "
        "by normalizing inputs before the attention and FFN operations.",
        {"source": "layer_norm", "topic": "transformers"},
    ),
    (
        "Token embeddings map discrete vocabulary indices to continuous vectors. "
        "The embedding matrix has shape (vocab_size, d_model). In many models, "
        "the same weight matrix is shared between the input embedding and the output projection.",
        {"source": "token_embeddings", "topic": "embeddings"},
    ),
    (
        "Groq's LPU (Language Processing Unit) achieves extremely low latency for LLM inference "
        "by using a deterministic, single-core architecture optimized for sequential token generation. "
        "This makes Groq ideal for real-time streaming applications like EternoMind.",
        {"source": "groq_lpu", "topic": "inference"},
    ),
]


async def main() -> None:
    from app.rag.retriever import get_retriever

    retriever = get_retriever()

    documents = [doc for doc, _ in DEMO_DOCUMENTS]
    metadatas = [meta for _, meta in DEMO_DOCUMENTS]

    print(f"Ingesting {len(documents)} demo documents into ChromaDB...")
    await retriever.ingest(documents, metadatas)
    print("✅ Done! ChromaDB collection 'eternomind_documents' is ready.")

    # Verify with a test search
    results = await retriever.similarity_search("attention mechanism", k=3)
    print(f"\nVerification — top 3 results for 'attention mechanism':")
    for i, r in enumerate(results, 1):
        print(f"  [{i}] score={r['score']:.3f} | {r['content'][:80]}...")


if __name__ == "__main__":
    asyncio.run(main())
