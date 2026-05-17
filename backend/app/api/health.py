from __future__ import annotations

from typing import Literal

import httpx
import redis as redis_lib
from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["health"])

ServiceStatus = Literal["ok", "error"]


class HealthResponse(BaseModel):
    backend: Literal["ok"] = "ok"
    redis: ServiceStatus
    chromadb: ServiceStatus


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Probe all downstream services and return their status.
    Always returns HTTP 200 — callers inspect the field values.
    """
    return HealthResponse(
        backend="ok",
        redis=_check_redis(),
        chromadb=await _check_chromadb(),
    )


def _check_redis() -> ServiceStatus:
    try:
        client = redis_lib.from_url(settings.redis_url, socket_connect_timeout=1)
        client.ping()
        return "ok"
    except Exception:
        return "error"


async def _check_chromadb() -> ServiceStatus:
    url = f"http://{settings.chroma_host}:{settings.chroma_port}/api/v1/heartbeat"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            return "ok" if resp.status_code == 200 else "error"
    except Exception:
        return "error"
