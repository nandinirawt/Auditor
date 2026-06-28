"""Application configuration.

All settings are environment-driven (12-factor). Values are validated and
typed via pydantic-settings so a misconfigured deployment fails fast at boot
rather than at request time.
"""
from functools import lru_cache
from typing import List, Literal, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ---- Application ----
    PROJECT_NAME: str = "UXSense"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ---- Server ----
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # ---- Security / JWT ----
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- CORS ----
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _assemble_cors(cls, v):
        # Accept a comma-separated string from .env or a real list.
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ---- Database ----
    DATABASE_URL: str
    SQL_ECHO: bool = False

    # ---- Redis / Celery ----
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    @property
    def broker_url(self) -> str:
        return self.CELERY_BROKER_URL or self.REDIS_URL

    @property
    def result_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND or self.REDIS_URL

    # ---- Rate limiting ----
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

    # ---- AI providers ----
    # NOTE: verify the current model IDs for your account before deploying.
    AI_PROVIDER: Literal["openai", "anthropic", "gemini"] = "anthropic"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-latest"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-pro"
    AI_MAX_TOKENS: int = 2048
    AI_TEMPERATURE: float = 0.2

    # ---- Voice (smallest.ai Text-to-Speech) ----
    # Redeem your promo code on the smallest.ai dashboard, then paste the API key
    # it gives you here (or in .env as SMALLEST_API_KEY). Optional — audio is
    # simply disabled if this is absent.
    SMALLEST_API_KEY: Optional[str] = None
    SMALLEST_TTS_URL: str = "https://api.smallest.ai/waves/v1/lightning-v3.1/get_speech"
    SMALLEST_VOICE_ID: str = "magnus"
    SMALLEST_SAMPLE_RATE: int = 24000

    # ---- Storage ----
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    STORAGE_LOCAL_DIR: str = "storage/screenshots"
    S3_BUCKET: Optional[str] = None
    S3_REGION: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None

    # ---- Browser automation ----
    PLAYWRIGHT_HEADLESS: bool = True
    CRAWL_MAX_PAGES: int = 15
    CRAWL_TIMEOUT_MS: int = 30000
    VIEWPORT_WIDTH: int = 1440
    VIEWPORT_HEIGHT: int = 900

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so settings are parsed exactly once per process."""
    return Settings()


settings = get_settings()
