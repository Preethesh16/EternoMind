from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # ── Database ─────────────────────────────────────────────
    database_url: str = "sqlite:///./eternomind.db"

    # ── Redis ────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── ChromaDB ─────────────────────────────────────────────
    chroma_host: str = "chromadb"
    chroma_port: int = 8001

    # ── Groq ─────────────────────────────────────────────────
    groq_api_key: str = ""

    # ── Hindsight ────────────────────────────────────────────
    hindsight_api_key: str = ""

    # ── cascadeflow ──────────────────────────────────────────
    cascadeflow_api_key: str = ""

    # ── Model Names ──────────────────────────────────────────
    groq_large_model: str = "llama-3.3-70b-versatile"
    groq_small_model: str = "llama-3.1-8b-instant"

    # ── CORS ─────────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Split comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (reads .env once)."""
    return Settings()


# Module-level singleton for convenience imports
settings: Settings = get_settings()
