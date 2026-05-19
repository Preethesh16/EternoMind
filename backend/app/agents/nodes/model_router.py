"""
Step 7 — Model Router node.

Uses cascadeflow to decide which Groq model to use for this pipeline run.
Also detects task-specific requirements (e.g., image generation → Vision model).
"""
from __future__ import annotations

import logging
import re

from app.agents.state import AgentState
from app.optimization.cascadeflow_router import get_cascadeflow_router

logger = logging.getLogger(__name__)


def _detect_vision_task(query: str) -> bool:
    """Detect if the query requires vision/multimodal capabilities (image generation/analysis)."""
    # Patterns for image generation/creation
    generation_patterns = [
        r"generate\s+(an?\s+)?image",
        r"create\s+(an?\s+)?image",
        r"draw\s+(an?\s+)?image",
        r"make\s+(an?\s+)?image",
    ]
    
    # Patterns for visualization/charting
    visual_patterns = [
        r"visualiz",
        r"diagram",
        r"chart",
        r"graph",
        r"plot",
    ]
    
    # Patterns for image analysis - allow flexible spacing
    analysis_patterns = [
        r"(analyze|describe|explain|interpret).{0,15}image",
        r"image.{0,15}(analysis|description)",
        r"what.{0,30}image",
        r"tell.{0,20}image",
        r"picture\s+(of|with)",
        r"show.{0,15}(picture|photo|image)",
    ]
    
    all_patterns = generation_patterns + visual_patterns + analysis_patterns
    
    for keyword in all_patterns:
        if re.search(keyword, query, re.IGNORECASE):
            logger.info("[model_router] Vision task detected: %s", query[:50])
            return True
    
    return False


async def model_router_node(state: AgentState) -> AgentState:
    """Select the appropriate Groq model based on task type, complexity, and safety."""
    from app.config import settings
    
    logger.info(
        "[model_router] memory_hits=%d token_estimate=%d complexity=%d",
        state["memory_hits"],
        state["token_estimate"],
        state.get("complexity_score", 1),
    )

    original_query = state.get("original_query", "")
    complexity_score = state.get("complexity_score", 1)
    safety_score = state.get("safety_score", 100)
    memory_hits = state.get("memory_hits", 0)
    token_estimate = state.get("token_estimate", 0)

    # Model selection logic:
    # 1. Vision/image tasks → Large (most capable for visual reasoning)
    # 2. Security threats → Large (careful analysis)
    # 3. Complexity-based routing with expert specialization:
    #    - Level 1-2: Small (fast, simple)
    #    - Level 3: Large (balanced)
    #    - Level 4: Expert/Specialized (mixtral for specialized reasoning)
    #    - Level 5: Large (most powerful)

    if _detect_vision_task(original_query):
        # Vision/image tasks need the most capable model
        selected_model = settings.groq_model_large
        logger.info("[model_router] 👁️  VISION TASK → Large model")
    
    elif safety_score < 70:
        # Security concerns - use Large model for careful handling
        selected_model = settings.groq_model_large
        logger.info("[model_router] 🔐 SECURITY CONCERN (safety=%d%%) → Large model", safety_score)
    
    elif complexity_score <= 2:
        # Very simple or simple → Small (fast, efficient)
        selected_model = settings.groq_model_small
        logger.info("[model_router] ⚡ SIMPLE (complexity=%d) → Small model", complexity_score)
    
    elif complexity_score == 3:
        # Medium complexity → Large (balanced power)
        selected_model = settings.groq_model_large
        logger.info("[model_router] ⚙️  MEDIUM (complexity=%d) → Large model", complexity_score)
    
    elif complexity_score == 4:
        # Complex/specialized → Expert (mixtral for specialized tasks)
        selected_model = settings.groq_model_expert
        logger.info("[model_router] 🧠 COMPLEX/SPECIALIZED (complexity=%d) → Expert model", complexity_score)
    
    else:  # complexity_score >= 5
        # Very complex/creative → Large (most powerful general model)
        selected_model = settings.groq_model_large
        logger.info("[model_router] 🎨 VERY COMPLEX/CREATIVE (complexity=%d) → Large model", complexity_score)

    event_callback = state.get("_event_callback")
    if event_callback:
        await event_callback("pipeline_step", {
            "step": "model_router",
            "status": "complete",
            "selected_model": selected_model
        })

    logger.info("[model_router] final model=%s", selected_model)
    return {**state, "selected_model": selected_model}
