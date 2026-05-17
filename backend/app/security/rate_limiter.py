from __future__ import annotations

import time
from typing import Callable

import redis as redis_lib
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config import settings

# ── Rate-limit rules (path_prefix → (max_requests, window_seconds)) ──────────
_RATE_RULES: dict[str, tuple[int, int]] = {
    "/api/v1/chat":       (60, 60),   # 60 req / 60 s
    "/api/v1/auth/login": (10, 60),   # 10 req / 60 s
}


def _get_redis_client() -> redis_lib.Redis | None:
    """Return a Redis client, or None if the server is unreachable."""
    try:
        client = redis_lib.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Redis-backed sliding-window rate limiter.

    For each rate-limited path prefix, a Redis key is maintained per
    client IP address using the pattern:
        rl:<path_prefix>:<ip>

    The key stores a counter with a TTL equal to the window.
    Returns HTTP 429 with Retry-After header when the limit is exceeded.
    Falls back gracefully (allows the request) if Redis is unavailable.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._redis: redis_lib.Redis | None = _get_redis_client()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        for prefix, (max_requests, window_seconds) in _RATE_RULES.items():
            if path.startswith(prefix):
                if self._redis is None:
                    # Redis down — fail open (don't block traffic)
                    break

                ip: str = request.client.host if request.client else "unknown"
                key = f"rl:{prefix}:{ip}"

                try:
                    pipe = self._redis.pipeline()
                    pipe.incr(key)
                    pipe.expire(key, window_seconds)
                    results = pipe.execute()
                    count: int = results[0]
                except Exception:
                    # Redis error — fail open
                    break

                if count > max_requests:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Rate limit exceeded. Try again later."},
                        headers={"Retry-After": str(window_seconds)},
                    )
                break  # Only apply the first matching rule

        return await call_next(request)
