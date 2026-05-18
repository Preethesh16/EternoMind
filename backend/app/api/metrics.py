"""
GET /api/v1/metrics/{session_id} — token savings metrics endpoint.

Returns per-interaction token counts for the Token Savings Chart.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import InteractionLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["metrics"])


class InteractionData(BaseModel):
    interaction_number: int
    token_count_input: int
    token_count_output: int
    model_used: str
    memory_hits: int
    latency_ms: float


class MetricsResponse(BaseModel):
    session_id: str
    interactions: list[InteractionData]


@router.get("/metrics/{session_id}", response_model=MetricsResponse)
async def get_metrics(
    session_id: str,
    db: Session = Depends(get_db),
) -> MetricsResponse:
    """
    Return all interaction logs for a session, ordered by interaction_number ASC.

    Used by the frontend Token Savings Chart to visualize token reduction over time.
    """
    logs = (
        db.query(InteractionLog)
        .filter(InteractionLog.session_id == session_id)
        .order_by(InteractionLog.interaction_number.asc())
        .all()
    )

    interactions = [
        InteractionData(
            interaction_number=log.interaction_number,
            token_count_input=log.token_count_input,
            token_count_output=log.token_count_output,
            model_used=log.model_used,
            memory_hits=log.memory_hits,
            latency_ms=log.latency_ms,
        )
        for log in logs
    ]

    logger.info(
        "[metrics] session=%s → %d interactions", session_id, len(interactions)
    )

    return MetricsResponse(session_id=session_id, interactions=interactions)
