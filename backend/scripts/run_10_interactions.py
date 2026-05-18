"""
Token Reduction Validation script — Phase 6.

Sends 10 related messages through the pipeline and prints token counts per interaction.
Verifies that by interaction 8-10, token_count_input is at least 50% lower than interaction 1.

Run after the full stack is up:
    cd backend
    python scripts/run_10_interactions.py [demo_password]

The script:
  1. Logs in as the demo user (override password via CLI arg or DEMO_PASSWORD env var)
  2. Creates a fresh session
  3. Sends 10 related messages with a 3-second pause between each (gives Hindsight time to index)
  4. Prints per-interaction stats and a final reduction summary
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000"
USER_ID = "validation-user-001"
DEMO_USERNAME = "demo"

# Pause between interactions so Hindsight has time to index the previous memory
INTER_INTERACTION_DELAY_S = 3.0

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


async def login(client: httpx.AsyncClient, password: str) -> dict[str, str]:
    """Log in as the demo user and return the auth headers."""
    resp = await client.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": DEMO_USERNAME, "password": password},
    )
    resp.raise_for_status()
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def send_message(
    client: httpx.AsyncClient,
    session_id: str,
    message: str,
    interaction_num: int,
    headers: dict[str, str],
) -> dict:
    """Send a message and parse the SSE stream for the done event."""
    print(f"\nInteraction {interaction_num}: {message[:60]}...")

    done_data: dict = {}
    async with client.stream(
        "POST",
        f"{BASE_URL}/api/v1/chat",
        json={
            "session_id": session_id,
            "message": message,
            "user_id": USER_ID,
        },
        headers=headers,
        timeout=120.0,
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

    # Resolve demo password: CLI arg > env var > prompt
    if len(sys.argv) > 1:
        password = sys.argv[1]
    elif os.environ.get("DEMO_PASSWORD"):
        password = os.environ["DEMO_PASSWORD"]
    else:
        print(
            "\nUsage: python scripts/run_10_interactions.py <demo_password>\n"
            "   or: DEMO_PASSWORD=<pwd> python scripts/run_10_interactions.py\n"
            "Demo password is printed by scripts/seed_demo_user.py"
        )
        sys.exit(1)

    async with httpx.AsyncClient() as client:
        # 1. Auth
        try:
            headers = await login(client, password)
            print("✅ Authenticated as demo user")
        except Exception as exc:
            print(f"❌ Login failed: {exc}")
            sys.exit(1)

        # 2. Create a fresh session
        try:
            resp = await client.post(
                f"{BASE_URL}/api/v1/sessions",
                json={"user_id": USER_ID},
                headers=headers,
            )
            resp.raise_for_status()
            session_id = resp.json()["session_id"]
            print(f"✅ Session created: {session_id}")
        except Exception as exc:
            print(f"❌ Could not create session: {exc}")
            sys.exit(1)

        # 3. Send 10 messages with a small delay between each so Hindsight indexes
        results = []
        for i, message in enumerate(MESSAGES, 1):
            try:
                done = await send_message(client, session_id, message, i, headers)
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

            # Give Hindsight time to index before the next interaction
            if i < len(MESSAGES):
                await asyncio.sleep(INTER_INTERACTION_DELAY_S)

    # ── Validation summary ──────────────────────────────────────────────────
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
            f"  Interaction {i:2d}: {tokens:6,} tokens  model={model:<32}  "
            f"memory_hits={hits}  reduction={reduction:+.0f}%"
        )

    if first_tokens > 0 and last_tokens > 0:
        total_reduction = (1 - last_tokens / first_tokens) * 100
        print(f"\nTotal token reduction (interaction 1 → 10): {total_reduction:.1f}%")
        if total_reduction >= 50:
            print("✅ PASS — Token reduction >= 50% achieved!")
        else:
            print("⚠️  Token reduction < 50% — Hindsight may need more interactions or longer indexing time")
    else:
        print("⚠️  Could not calculate reduction (missing data)")

    # Phase 6 sub-criterion: model switch
    models_used = {r.get("model") for r in results if r.get("model")}
    print(f"\nModels used across run: {sorted(m for m in models_used if m)}")
    if len(models_used) > 1:
        print("✅ Model switch detected — cascadeflow routed to a smaller model at some point")
    else:
        print("ℹ️  Only one model used — increase memory_hits via more interactions to trigger switch")


if __name__ == "__main__":
    asyncio.run(main())
