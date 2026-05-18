"""
Step 8 — LLM Inference node.

Calls the Groq API with the optimized prompt and streams the response.
The event_callback is injected via state so the graph can emit SSE tokens.
"""
from __future__ import annotations

import logging
from typing import Any

from app.agents.state import AgentState
from app.config import settings

logger = logging.getLogger(__name__)


async def llm_inference_node(state: AgentState) -> AgentState:
    """
    Call Groq with the optimized prompt.

    Streams tokens back via the event_callback stored in state (if present).
    Accumulates the full response text and token counts.
    """
    logger.info("[llm_inference] model=%s", state["selected_model"])

    event_callback = state.get("_event_callback")  # type: ignore[call-overload]

    try:
        from groq import AsyncGroq  # type: ignore[import]

        client = AsyncGroq(api_key=settings.groq_api_key)

        messages = [{"role": "user", "content": state["optimized_prompt"]}]

        response_text = ""
        token_count_input = 0
        token_count_output = 0

        stream = await client.chat.completions.create(
            model=state["selected_model"],
            messages=messages,
            stream=True,
            max_tokens=2048,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                response_text += delta
                if event_callback:
                    await event_callback(
                        "token",
                        {"step": "response", "token_delta": delta},
                    )

            # Capture usage from the final chunk
            if chunk.usage:
                token_count_input = chunk.usage.prompt_tokens or 0
                token_count_output = chunk.usage.completion_tokens or 0

        # If usage wasn't in the stream, estimate from text length
        if token_count_input == 0:
            token_count_input = state.get("token_estimate", 0)
        if token_count_output == 0:
            token_count_output = int(len(response_text.split()) * 1.3)

        logger.info(
            "[llm_inference] model=%s input_tokens=%d output_tokens=%d",
            state["selected_model"],
            token_count_input,
            token_count_output,
        )

        return {
            **state,
            "response_text": response_text,
            "token_count_input": token_count_input,
            "token_count_output": token_count_output,
        }

    except Exception as exc:
        logger.error("[llm_inference] Groq call failed: %s", exc)
        if event_callback:
            await event_callback(
                "error",
                {"step": "llm_inference", "message": str(exc)},
            )
        return {
            **state,
            "response_text": f"Error: {exc}",
            "token_count_input": state.get("token_estimate", 0),
            "token_count_output": 0,
        }
