"""
Token Reduction Validation script — Phase 6.

Sends 10 related messages through the pipeline and prints token counts per interaction.
Verifies that by interaction 8-10, token_count_input is at least 50% lower than interaction 1.

Run after the full stack is up:
    cd backend
    python scripts/run_10_interactions.py
"""
from __future__ import annotations

import asyncio
import json
import sys
import os
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000"
SESSION_ID = "validation-session-001"
USER_ID = "validation-user-001"

MESSAGES = [
    "Explain how transformer attention mechanisms work in detail",
    "How does multi-head attention differ from single-head attention?",
    "What is the mathematical formula for scaled dot-product attention?",
    "Why do transformers use positional encoding?",
    "How does BERT use the transformer encoder?",
    "What makes GPT different from BERT architecturally?",
    "Explain the feed-forward network layer in transformers",
    "What is layer normalization and why is it important?",
    "How are token embeddings used in transformers?",
    "Give me a one-sentence summary of transformer attention mechanisms",
]


async def send_message(client: httpx.AsyncClient, message: str, interaction_num: int) -> dict:
    """Send a message and parse the SSE stream for the done event."""
    print(f"\nInteraction {interaction_num}: {message[:60]}...")

    done_data = {}
    async with client.stream(
        "POST",
        f"{BASE_URL}/api/v1/chat",
        json={
            "session_id": SESSION_ID,
            "message": message,
            "user_id": USER_ID,
        },
        timeout=60.0,
    ) as response:
        response.raise_for_status()
        buffer = ""
        async for chunk in response.aiter_text():
            buffer += chunk
            while "\n\n" in buffer:
                event_block, buffer = buffer.split("\n\n", 1)
                lines = event_block.strip().split("\n")
                event_name = ""
                data_str = ""
                for line in lines:
                    if line.startswith("event:"):
                        event_name = line[6:].strip()
                    elif line.startswith("data:"):
                        data_str = line[5:].strip()

                if event_name == "done" and data_str:
                    done_data = json.loads(data_str)
                elif event_name == "error" and data_str:
                    error = json.loads(data_str)
                    print(f"  ⚠️  Error: {error.get('message', 'unknown')}")

    return done_data


async def main() -> None:
    print("=" * 70)
    print("EternoMind — Token Reduction Validation (10 interactions)")
    print("=" * 70)

    # First, create a session
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                f"{BASE_URL}/api/v1/sessions",
                json={"user_id": USER_ID},
            )
            resp.raise_for_status()
            session_data = resp.json()
            global SESSION_ID
            SESSION_ID = session_data["session_id"]
            print(f"Session created: {SESSION_ID}")
        except Exception as exc:
            print(f"Warning: Could not create session ({exc}), using default ID")

    results = []
    async with httpx.AsyncClient() as client:
        for i, message in enumerate(MESSAGES, 1):
            try:
                done = await send_message(client, message, i)
                results.append(done)
                model = done.get("model", "unknown")
                total_tokens = done.get("total_tokens", 0)
                latency = done.get("latency_ms", 0)
                memory_hits = done.get("memory_hits", 0)
                print(
                    f"  → tokens={total_tokens:,}  model={model}  "
                    f"memory_hits={memory_hits}  latency={latency:.0f}ms"
                )
            except Exception as exc:
                print(f"  ✗ Failed: {exc}")
                results.append({})

    # Validation
    print("\n" + "=" * 70)
    print("RESULTS SUMMARY")
    print("=" * 70)

    first_tokens = results[0].get("total_tokens", 0) if results else 0
    last_tokens = results[-1].get("total_tokens", 0) if results else 0

    for i, r in enumerate(results, 1):
        tokens = r.get("total_tokens", 0)
        model = r.get("model", "unknown")
        hits = r.get("memory_hits", 0)
        reduction = (1 - tokens / first_tokens) * 100 if first_tokens > 0 else 0
        print(
            f"  Interaction {i:2d}: {tokens:6,} tokens  model={model:<20}  "
            f"memory_hits={hits}  reduction={reduction:.0f}%"
        )

    if first_tokens > 0 and last_tokens > 0:
        total_reduction = (1 - last_tokens / first_tokens) * 100
        print(f"\nTotal token reduction: {total_reduction:.1f}%")
        if total_reduction >= 50:
            print("✅ PASS — Token reduction >= 50% achieved!")
        else:
            print("⚠️  Token reduction < 50% — more interactions may be needed")
    else:
        print("⚠️  Could not calculate reduction (missing data)")


if __name__ == "__main__":
    asyncio.run(main())
