from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CreateSessionRequest(BaseModel):
    user_id: str


class SessionResponse(BaseModel):
    """Returned on POST /api/v1/sessions (201)."""
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    created_at: datetime


class SessionDetailResponse(BaseModel):
    """Returned on GET /api/v1/sessions/{session_id} (200)."""
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    user_id: str
    created_at: datetime
    interaction_count: int
