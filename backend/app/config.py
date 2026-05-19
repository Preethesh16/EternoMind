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
    # 4 available Groq models with different specializations
    groq_model_small: str = "llama-3.1-8b-instant"            # Small (Fast) - 8B params
    groq_model_large: str = "llama-3.3-70b-versatile"         # Large (Accurate) - 70B params
    groq_model_expert: str = "meta-llama/llama-4-scout-17b-16e-instruct"  # Expert (Specialized) - Llama 4 Scout
    groq_model_vision: str = "llama-3.3-70b-versatile"        # Vision - fallback to Large (3.2-90b-vision deprecated)
    
    # Model routing by complexity level (1-5)
    groq_model_very_simple: str = "llama-3.1-8b-instant"      # Level 1: Factual/simple → Small
    groq_model_simple: str = "llama-3.1-8b-instant"           # Level 2: Light reasoning → Small
    groq_model_medium: str = "llama-3.3-70b-versatile"        # Level 3: Standard reasoning → Large
    groq_model_complex: str = "meta-llama/llama-4-scout-17b-16e-instruct"  # Level 4: Complex/specialized → Scout
    groq_model_very_complex: str = "llama-3.3-70b-versatile"  # Level 5: Very complex/creative → Large
    
    # Legacy aliases for backward compatibility
    @property
    def groq_small_model(self) -> str:
        """Backward compat: SMALL = level 1 (very simple)"""
        return self.groq_model_very_simple
    
    @property
    def groq_large_model(self) -> str:
        """Backward compat: LARGE = level 5 (very complex)"""
        return self.groq_model_very_complex
    
    def get_model_for_complexity(self, complexity_level: int) -> str:
        """Get the model name for a given complexity level (1-5)."""
        if complexity_level <= 1:
            return self.groq_model_very_simple
        elif complexity_level == 2:
            return self.groq_model_simple
        elif complexity_level == 3:
            return self.groq_model_medium
        elif complexity_level == 4:
            return self.groq_model_complex
        else:  # 5+
            return self.groq_model_very_complex

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
