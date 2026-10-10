from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from core.config import settings

import os
import shutil
import ssl

# If running on Vercel and using SQLite, the file system is read-only. Copy DB to /tmp which is writable.
db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)
else:
    ssl_context = ssl.create_default_context()
    
    engine = create_engine(
        db_url,
        poolclass=NullPool,
        connect_args={"ssl_context": ssl_context}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
