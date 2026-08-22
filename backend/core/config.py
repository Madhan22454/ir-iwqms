import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IR-IWQMS"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "demo-super-secret-key-12345" # In production, this should be a secure random string
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # SQLite for prototype
    DATABASE_URL: str = "sqlite:///./ir_iwqms.db"

    class Config:
        case_sensitive = True

settings = Settings()
