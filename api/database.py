"""
Database engine configuration for IR-IWQMS.
Supports SQLite (local dev) and PostgreSQL/pg8000 (production on Supabase).
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from core.config import settings
import logging

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL.strip()

if db_url.startswith("sqlite"):
    # Local development — SQLite
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
    logger.info("Database engine: SQLite (local dev)")
else:
    # Production — PostgreSQL via pg8000 or psycopg2
    # pg8000 uses ssl_context differently from psycopg2.
    # Pass ssl="require" as a query param if the URL doesn't already include it.
    # NullPool is essential for serverless (Vercel) to avoid connection leaks.
    try:
        engine = create_engine(
            db_url,
            poolclass=NullPool,
            # pg8000 accepts ssl as a boolean connect arg, NOT ssl_context
            connect_args={"ssl_context": None},
        )
        # Quick connectivity test
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database engine: PostgreSQL (connected successfully)")
    except Exception as e:
        # Try without any ssl connect_args — some PostgreSQL providers
        # handle SSL via the URL (sslmode=require) rather than connect_args
        logger.warning(f"First PostgreSQL connection attempt failed ({e}), retrying without ssl connect_args...")
        try:
            engine = create_engine(db_url, poolclass=NullPool)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database engine: PostgreSQL (connected, no ssl connect_args)")
        except Exception as e2:
            logger.error(f"PostgreSQL connection failed: {e2}")
            # Fall through — engine object still set, errors will surface per-request
            engine = create_engine(db_url, poolclass=NullPool)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
