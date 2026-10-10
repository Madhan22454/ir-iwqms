import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IR-IWQMS"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "demo-super-secret-key-12345") # Must be overridden in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # Support public deployment or fallback to local SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ir_iwqms.db").strip()
    
    # CORS Origins (comma separated list from env)
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,https://madhan22454.github.io").strip()

    class Config:
        case_sensitive = True

settings = Settings()

def validate_production_settings(s: Settings):
    if os.environ.get("VERCEL") == "1":
        if not s.SECRET_KEY or s.SECRET_KEY == "demo-super-secret-key-12345":
            raise ValueError("A secure SECRET_KEY must be provided in production")
        if not s.DATABASE_URL or s.DATABASE_URL.startswith("sqlite"):
            raise ValueError("A valid PostgreSQL DATABASE_URL must be provided in production")

validate_production_settings(settings)
