from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import Base, engine
from app.security.rate_limiter import RateLimitMiddleware

# ── Routers ──────────────────────────────────────────────────────────────────
from app.api import auth as auth_router
from app.api import health as health_router
from app.api import sessions as sessions_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create all DB tables on startup (Alembic handles migrations in prod)."""
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown hooks can go here if needed


# ── App factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="EternoMind Backend API",
    description=(
        "Self-Optimizing Memory-Aware AI Runtime — "
        "backend foundation by Person 1 (backend-core branch)."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

# ── Routers ──────────────────────────────────────────────────────────────────

app.include_router(health_router.router)
app.include_router(auth_router.router)
app.include_router(sessions_router.router)

# Person 2: AI pipeline endpoints
from app.api import chat as chat_router
from app.api import metrics as metrics_router

app.include_router(chat_router.router)
app.include_router(metrics_router.router)
