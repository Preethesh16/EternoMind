from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )

    sessions: Mapped[list[ChatSession]] = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )


class ChatSession(Base):
    """
    Named ChatSession to avoid collision with SQLAlchemy's internal Session class.
    The table is still called 'sessions' to match the API contract.
    """
    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )
    interaction_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped[User] = relationship("User", back_populates="sessions")
    interaction_logs: Mapped[list[InteractionLog]] = relationship(
        "InteractionLog", back_populates="session", cascade="all, delete-orphan"
    )


class InteractionLog(Base):
    """
    Written by Person 2's pipeline after every chat interaction.
    Column names are contractually fixed — do not rename.
    """
    __tablename__ = "interaction_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.session_id"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    interaction_number: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count_input: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count_output: Mapped[int] = mapped_column(Integer, nullable=False)
    model_used: Mapped[str] = mapped_column(String, nullable=False)
    memory_hits: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )

    session: Mapped[ChatSession] = relationship(
        "ChatSession", back_populates="interaction_logs"
    )
