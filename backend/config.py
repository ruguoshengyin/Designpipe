"""
Centralised application settings.
All env vars are read here; the rest of the app imports from this module.
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── AI provider ────────────────────────────────────────────────────────────
    api_key: str = ""
    api_url: str = "https://api.apiyi.com/v1/chat/completions"
    model: str = "claude-sonnet-4-5-20250929"
    max_tokens: int = 8000
    temperature: float = 0.7
    request_timeout: int = 180          # seconds

    # ── Database ───────────────────────────────────────────────────────────────
    db_path: str = os.path.join(os.path.dirname(__file__), "..", "dp.db")

    # ── Feature flags ─────────────────────────────────────────────────────────
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()
