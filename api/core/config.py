import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IR-IWQMS"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "demo-super-secret-key-12345" # In production, this should be a secure random string
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # Support public deployment or fallback to local SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ir_iwqms.db").strip()
    
    # CORS Origins (comma separated list from env)
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,https://madhan22454.github.io").strip()

    class Config:
        case_sensitive = True

settings = Settings()
