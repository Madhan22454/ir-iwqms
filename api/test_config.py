import os
import pytest
from core.config import Settings, validate_production_settings

@pytest.fixture(autouse=True)
def clean_env():
    # Save original VERCEL env var
    orig_vercel = os.environ.get("VERCEL")
    yield
    # Restore original VERCEL env var
    if orig_vercel is not None:
        os.environ["VERCEL"] = orig_vercel
    elif "VERCEL" in os.environ:
        del os.environ["VERCEL"]

def test_vercel_missing_secret():
    os.environ["VERCEL"] = "1"
    s = Settings(SECRET_KEY="", DATABASE_URL="postgresql://user:pass@host/db")
    with pytest.raises(ValueError, match="SECRET_KEY"):
        validate_production_settings(s)

def test_vercel_demo_secret():
    os.environ["VERCEL"] = "1"
    s = Settings(SECRET_KEY="demo-super-secret-key-12345", DATABASE_URL="postgresql://user:pass@host/db")
    with pytest.raises(ValueError, match="SECRET_KEY"):
        validate_production_settings(s)

def test_vercel_missing_database():
    os.environ["VERCEL"] = "1"
    s = Settings(SECRET_KEY="secure-key-123", DATABASE_URL="")
    with pytest.raises(ValueError, match="DATABASE_URL"):
        validate_production_settings(s)

def test_vercel_sqlite_database():
    os.environ["VERCEL"] = "1"
    s = Settings(SECRET_KEY="secure-key-123", DATABASE_URL="sqlite:///./test.db")
    with pytest.raises(ValueError, match="DATABASE_URL"):
        validate_production_settings(s)

def test_vercel_valid():
    os.environ["VERCEL"] = "1"
    s = Settings(SECRET_KEY="secure-key-123", DATABASE_URL="postgresql://user:pass@host/db")
    validate_production_settings(s) # Should not raise

def test_local_dev():
    if "VERCEL" in os.environ:
        del os.environ["VERCEL"]
    s = Settings(SECRET_KEY="demo-super-secret-key-12345", DATABASE_URL="sqlite:///./ir_iwqms.db")
    validate_production_settings(s) # Should not raise
