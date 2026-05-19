#!/usr/bin/env python3
"""
Test script to verify the optimizer fix is working correctly.
Tests that:
1. Config has correct model names
2. PromptOptimizer can be instantiated and used
3. CascadeflowRouter can be instantiated and route correctly
"""
import asyncio
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

async def test_config():
    """Test 1: Verify config has correct model names"""
    from app.config import settings
    
    print("=" * 60)
    print("TEST 1: Config Model Names")
    print("=" * 60)
    
    assert settings.groq_large_model == "llama-3.3-70b-versatile", \
        f"Expected 'llama-3.3-70b-versatile', got '{settings.groq_large_model}'"
    assert settings.groq_small_model == "llama-3.1-8b-instant", \
        f"Expected 'llama-3.1-8b-instant', got '{settings.groq_small_model}'"
    
    print(f"✅ Large Model: {settings.groq_large_model}")
    print(f"✅ Small Model: {settings.groq_small_model}")
    print()


async def test_prompt_optimizer():
    """Test 2: Verify PromptOptimizer works"""
    from app.optimization.prompt_optimizer import get_prompt_optimizer
    
    print("=" * 60)
    print("TEST 2: Prompt Optimizer")
    print("=" * 60)
    
    optimizer = get_prompt_optimizer()
    
    # Test with sample data
    query = "What is a transformer?"
    memories = [
        {"content": "Transformers use attention mechanisms", "relevance_score": 0.9},
        {"content": "Self-attention allows models to focus on relevant parts", "relevance_score": 0.85},
    ]
    rag_docs = [
        {"content": "A transformer is a neural network architecture...", "score": 0.95},
        {"content": "Attention is all you need paper published in 2017", "score": 0.88},
    ]
    
    optimized_prompt, token_estimate = await optimizer.optimize(query, memories, rag_docs)
    
    assert len(optimized_prompt) > 0, "Optimized prompt is empty"
    assert token_estimate > 0, "Token estimate should be positive"
    assert "What is a transformer?" in optimized_prompt, "Query should be in optimized prompt"
    
    print(f"✅ Optimized prompt length: {len(optimized_prompt)} chars")
    print(f"✅ Token estimate: {token_estimate}")
    print(f"✅ Sample optimized prompt:\n{optimized_prompt[:300]}...\n")


async def test_cascadeflow_router():
    """Test 3: Verify CascadeflowRouter routing logic"""
    from app.optimization.cascadeflow_router import get_cascadeflow_router
    from app.config import settings
    
    print("=" * 60)
    print("TEST 3: Cascadeflow Router")
    print("=" * 60)
    
    router = get_cascadeflow_router()
    
    # Test case 1: High memory hits, low tokens → should use small model
    model = await router.route(memory_hits=5, token_estimate=1500)
    assert model == settings.groq_small_model, \
        f"Expected small model for high hits + low tokens, got {model}"
    print(f"✅ Test 1 (high hits, low tokens): {model} (small model)")
    
    # Test case 2: Low memory hits → should use large model
    model = await router.route(memory_hits=2, token_estimate=800)
    assert model == settings.groq_large_model, \
        f"Expected large model for low hits, got {model}"
    print(f"✅ Test 2 (low hits): {model} (large model)")
    
    # Test case 3: High memory hits but high tokens → should use large model
    model = await router.route(memory_hits=5, token_estimate=2500)
    assert model == settings.groq_large_model, \
        f"Expected large model for high tokens, got {model}"
    print(f"✅ Test 3 (high hits, high tokens): {model} (large model)")
    
    # Test case 4: Boundary condition (exactly 4 hits, below 2000 tokens)
    model = await router.route(memory_hits=4, token_estimate=1999)
    assert model == settings.groq_small_model, \
        f"Expected small model at boundary, got {model}"
    print(f"✅ Test 4 (boundary - 4 hits, 1999 tokens): {model} (small model)")
    
    print()


async def main():
    """Run all tests"""
    try:
        await test_config()
        await test_prompt_optimizer()
        await test_cascadeflow_router()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe optimizer fix is working correctly:")
        print("- Config has correct model names")
        print("- PromptOptimizer can optimize prompts")
        print("- CascadeflowRouter can route correctly")
        
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
