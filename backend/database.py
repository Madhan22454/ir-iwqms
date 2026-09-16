from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

import os
import shutil

# Force SQLite for now due to dead PostgreSQL database
db_url = "sqlite:///./ir_iwqms.db"

# If running on Vercel, the file system is read-only. Copy DB to /tmp which is writable.
if os.environ.get("VERCEL") == "1":
    if not os.path.exists("/tmp/ir_iwqms.db"):
        shutil.copy2("./ir_iwqms.db", "/tmp/ir_iwqms.db")
    db_url = "sqlite:////tmp/ir_iwqms.db"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
