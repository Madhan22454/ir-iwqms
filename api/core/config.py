"""
Application configuration — reads from environment variables.
On Vercel production, DATABASE_URL and SECRET_KEY MUST be set in
the Vercel dashboard (Project → Settings → Environment Variables).
"""
import os
import logging
import sys

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    PROJECT_NAME: str = "IR-IWQMS"
    API_V1_STR: str = "/api/v1"

    # Must be overridden in production via Vercel environment variable
    SECRET_KEY: str = os.getenv("SECRET_KEY", "demo-super-secret-key-12345")

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # PostgreSQL (Supabase) in production; SQLite as local fallback
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./ir_iwqms.db"
    ).strip()

    # CORS Origins — comma-separated list from env
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://madhan22454.github.io",
    ).strip()

    class Config:
        case_sensitive = True


settings = Settings()


def validate_production_settings(s: Settings):
    """
    Validate production settings when running on Vercel.
    Raises ValueError if required production variables are absent.
    """
    if os.environ.get("VERCEL") == "1":
        if not s.SECRET_KEY or s.SECRET_KEY == "demo-super-secret-key-12345":
            raise ValueError("A secure SECRET_KEY must be provided in production")
        if not s.DATABASE_URL or s.DATABASE_URL.startswith("sqlite"):
            raise ValueError("A valid PostgreSQL DATABASE_URL must be provided in production")


# Validate on startup with graceful warning to prevent hard crash if env vars are pending
try:
    validate_production_settings(settings)
except ValueError as ex:
    logger.warning("PRODUCTION CONFIGURATION WARNING: %s", ex)
    print(f"[IR-IWQMS WARNING] {ex}", file=sys.stderr)
