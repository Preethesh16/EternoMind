#!/usr/bin/env python3
"""
Advanced demonstration of EternoMind's Prompt Optimization and Model Switching.

This script demonstrates:
1. Original Prompt (Full context)
2. Optimized Prompt (Surgically compressed context)
3. Token Reduction Analysis
4. Model Switching (CascadeFlow logic)
5. Automated Prompt Goal Extraction
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.optimization.prompt_optimizer import get_prompt_optimizer
from app.optimization.cascadeflow_router import get_cascadeflow_router
from app.config import settings

async def run_demo():
    print("\n" + "█" * 80)
    print("      ETERNOMIND: OPTIMIZER & MODEL SWITCHING DEMO")
    print("█" * 80 + "\n")

    from groq import AsyncGroq
    client = AsyncGroq(api_key=os.environ.get["GROQ_API_KEY"])

    # --- INPUT DATA ---
    query = "How do I secure my FastAPI application with OAuth2?"
    
    # Large context to demonstrate reduction
    long_memories = [
        {"content": "OAuth2 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service, such as Amazon, Google, Facebook, and GitHub. It works by delegating user authentication to the service that hosts the user account, and authorizing third-party applications to access the user account.", "relevance_score": 0.95},
        {"content": "FastAPI provides a security module that simplifies implementing OAuth2 with Password flow and Bearer tokens. You can use OAuth2PasswordBearer to define the token URL and use it as a dependency in your routes to enforce authentication.", "relevance_score": 0.98},
        {"content": "To secure FastAPI, you should also use a secret key for signing JWT tokens. The jose library is commonly used for this. You must ensure that the secret key is kept secret and not committed to version control.", "relevance_score": 0.92},
        {"content": "Redundant memory: OAuth2 is very common. It is used everywhere. Many people use it for security. It is a standard protocol for authorization.", "relevance_score": 0.40},
        {"content": "Another redundant memory: FastAPI is fast. It is based on Starlette and Pydantic. It is very popular among Python developers for building APIs.", "relevance_score": 0.35},
        {"content": "Extra memory 6: JWT stands for JSON Web Token. It is an open standard that defines a compact and self-contained way for securely transmitting information between parties.", "relevance_score": 0.88},
    ]

    long_docs = [
        {"content": "Documentation snippet 1: To implement OAuth2 in FastAPI, first create an OAuth2PasswordBearer instance. Then, create a function that takes the token as a string and decodes it. Use the decoded data to look up the user in your database. Finally, use this function as a dependency in your API endpoints. Example: @app.get('/users/me') def read_users_me(current_user: User = Depends(get_current_user)): return current_user", "score": 0.90},
        {"content": "Documentation snippet 2: Always use HTTPS in production. OAuth2 sends tokens in the header, and without encryption, they can be intercepted. Also, use short-lived access tokens and longer-lived refresh tokens to balance security and user experience.", "score": 0.85},
        {"content": "Documentation snippet 3: Inactive docs about older versions of Python. Not very relevant to the current FastAPI setup but still in the database for some reason.", "score": 0.20},
    ]

    # --- 1. SHOW ORIGINAL PROMPT ---
    print("--- [1] ORIGINAL UNOPTIMIZED PROMPT ---")
    original_prompt = f"""System: You are EternoMind, a helpful AI assistant.
Relevant context:
{chr(10).join([f"- {m['content']}" for m in long_memories])}
{chr(10).join([f"- {d['content']}" for d in long_docs])}

User: {query}"""
    
    print(original_prompt)
    original_tokens = int(len(original_prompt.split()) * 1.3)
    print(f"\n[Original Token Estimate: ~{original_tokens}]\n")

    # --- 2. SHOW OPTIMIZED PROMPT ---
    print("--- [2] OPTIMIZED PROMPT (Surgical Compression) ---")
    optimizer = get_prompt_optimizer()
    optimized_prompt, opt_tokens, prompt_goal = await optimizer.optimize(
        query=query,
        memories=long_memories,
        rag_docs=long_docs,
        groq_client=client,
    )
    
    print(f"SURGICAL GOAL: \"{prompt_goal}\"\n")
    print(optimized_prompt)
    print(f"\n[Optimized Token Estimate: ~{opt_tokens}]")

    # --- 3. SHOW TOKEN REDUCTION ---
    reduction = original_tokens - opt_tokens
    percent = (reduction / original_tokens) * 100
    print(f"\n--- [3] TOKEN REDUCTION ANALYSIS ---")
    print(f"Original:  {original_tokens} tokens")
    print(f"Optimized: {opt_tokens} tokens")
    print(f"REDUCED:   {reduction} tokens ({percent:.1f}% reduction)")
    print(f"Status:    ✅ SUCCESS\n")

    # --- 4. SHOW MODEL SWITCHING ---
    print("--- [4] MODEL SWITCHING (CascadeFlow) ---")
    router = get_cascadeflow_router()
    
    # Case A: Low complexity (many memory hits, low tokens)
    print("Scenario A: High memory coverage, Low token count")
    model_a = await router.route(memory_hits=5, token_estimate=500)
    print(f"   Input: hits=5, tokens=500  =>  Selected: {model_a}")
    
    # Case B: High complexity (few memory hits, high tokens)
    print("Scenario B: Low memory coverage, High token count")
    model_b = await router.route(memory_hits=1, token_estimate=2500)
    print(f"   Input: hits=1, tokens=2500 =>  Selected: {model_b}")

    # Case C: Real-world result from our optimized prompt
    print(f"Scenario C: Current Task")
    model_c = await router.route(memory_hits=len(long_memories), token_estimate=opt_tokens)
    print(f"   Input: hits={len(long_memories)}, tokens={opt_tokens} =>  Selected: {model_c}")
    
    print("\n" + "█" * 80)
    print("      DEMO COMPLETE")
    print("█" * 80 + "\n")

if __name__ == "__main__":
    # Ensure environment variables are loaded
    os.environ.setdefault("GROQ_LARGE_MODEL", "llama-3.3-70b-versatile")
    os.environ.setdefault("GROQ_SMALL_MODEL", "llama-3.1-8b-instant")
    
    asyncio.run(run_demo())
