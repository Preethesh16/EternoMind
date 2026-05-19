"""
Groq pricing calculator for token costs.

As of May 2026, Groq pricing (per 1,000,000 tokens):
- llama-3.3-70b-versatile: $0.59 input, $0.79 output
- llama-3.1-8b-instant: $0.05 input, $0.08 output
- llama-3.1-70b-versatile: $0.59 input, $0.79 output
- llama-3.2-90b-vision-preview: $0.50 input, $0.50 output

This module provides cost estimation for API calls.
"""
from __future__ import annotations


# Pricing per 1,000,000 tokens (in USD)
GROQ_PRICING = {
    # Small models
    "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
    
    # Large models
    "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
    "llama-3.1-70b-versatile": {"input": 0.59, "output": 0.79},
    
    # Vision models
    "llama-3.2-90b-vision-preview": {"input": 0.50, "output": 0.50},
}


def estimate_cost(
    model: str,
    input_tokens: int,
    output_tokens: int,
) -> float:
    """
    Estimate the cost in USD for a Groq API call.
    
    Args:
        model: Groq model name
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
    
    Returns:
        Estimated cost in USD
    """
    pricing = GROQ_PRICING.get(model, GROQ_PRICING["llama-3.1-8b-instant"])
    
    # Convert tokens to millions for pricing calculation
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    
    return round(input_cost + output_cost, 6)


def format_cost(cost: float) -> str:
    """Format cost as a string with currency."""
    if cost < 0.0001:
        return "$0.00001"
    elif cost < 0.001:
        return f"${cost:.5f}"
    elif cost < 0.01:
        return f"${cost:.4f}"
    else:
        return f"${cost:.2f}"
