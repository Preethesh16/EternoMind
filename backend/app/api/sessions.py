from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import ChatSession, User
from app.schemas.sessions import (
    CreateSessionRequest,
    SessionDetailResponse,
    SessionResponse,
)
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    """Create a new chat session for the authenticated user."""
    session = ChatSession(
        session_id=str(uuid.uuid4()),
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        interaction_count=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionResponse(
        session_id=session.session_id,
        created_at=session.created_at,
    )


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SessionDetailResponse:
    """Retrieve session details by session_id."""
    session: ChatSession | None = (
        db.query(ChatSession)
        .filter(ChatSession.session_id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return SessionDetailResponse(
        session_id=session.session_id,
        user_id=str(session.user_id),
        created_at=session.created_at,
        interaction_count=session.interaction_count,
    )
