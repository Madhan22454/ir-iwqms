"""
IR-IWQMS FastAPI Application — v2.0
Indian Railways Integrated Water Quality Monitoring & Surveillance System
"""
import sys
import os

# Ensure api directory is always on sys.path for Vercel serverless environment
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("ir_iwqms")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

# Import ALL models first so SQLAlchemy registers them before create_all
from models import user, hierarchy, master, lab, alert, workflow, audit  # noqa: F401

from database import Base, engine

from api import auth, hierarchy as hierarchy_api, master as master_api
from api import healthcard, users, labs, alerts, workflow as workflow_api

# ── Application ────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Indian Railways Integrated Water Quality Monitoring & Surveillance System",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# ── CORS ───────────────────────────────────────────────────────────────────────

cors_origins = [
    origin.strip()
    for origin in settings.ALLOWED_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=".*",  # permissive for dev/demo — tighten for strict production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])

app.include_router(
    hierarchy_api.router,
    prefix=f"{settings.API_V1_STR}/hierarchy",
    tags=["hierarchy"],
)

app.include_router(
    master_api.router,
    prefix=f"{settings.API_V1_STR}/master",
    tags=["master"],
)

app.include_router(
    healthcard.router,
    prefix=f"{settings.API_V1_STR}/health",
    tags=["healthcard"],
)

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["users"],
)

app.include_router(
    labs.router,
    prefix=f"{settings.API_V1_STR}/labs",
    tags=["laboratory"],
)

app.include_router(
    alerts.router,
    prefix=f"{settings.API_V1_STR}/alerts",
    tags=["alerts"],
)

app.include_router(
    workflow_api.router,
    prefix=f"{settings.API_V1_STR}/workflow",
    tags=["workflow"],
)


# ── Root ───────────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
def read_root():
    return {
        "application": "IR-IWQMS API",
        "version": "2.0.0",
        "docs": f"{settings.API_V1_STR}/openapi.json",
    }


@app.get("/health")
@app.get("/api/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "ok", "application": "IR-IWQMS"}


# ── Diagnostic endpoint ───────────────────────────────────────────────────────

@app.get("/api/v1/system/auth-status")
def auth_status():
    """Safe diagnostic endpoint — no secrets exposed."""
    import traceback

    result: dict = {
        "backend": "online",
        "database": "unknown",
        "db_driver": (
            settings.DATABASE_URL.split("://")[0]
            if "://" in settings.DATABASE_URL
            else "unknown"
        ),
        "user_count": 0,
        "demo_users": [],
    }
    try:
        from database import SessionLocal
        from models.user import User
        from core.security import verify_password

        db = SessionLocal()
        users_list = db.query(User).all()
        result["database"] = "connected"
        result["user_count"] = len(users_list)
        
        central_admin = next((u for u in users_list if u.employee_id == "central.admin"), None)
        result["central_admin_status"] = {
            "exists": central_admin is not None,
            "is_active": central_admin.is_active if central_admin else False,
            "role": str(central_admin.role) if central_admin else None,
            "password_valid_for_admin123": verify_password("admin123", central_admin.hashed_password) if central_admin else False,
        }
        
        result["demo_users"] = [
            {
                "employee_id": u.employee_id,
                "role": str(u.role),
                "is_active": u.is_active,
            }
            for u in users_list[:10]  # Return at most 10 for diagnosis
        ]
        db.close()
    except Exception as e:
        result["database"] = f"error: {type(e).__name__}: {str(e)}"
        result["traceback"] = traceback.format_exc()
    return result


# ── Dashboard Summary Endpoint ────────────────────────────────────────────────

@app.get("/api/v1/dashboard/summary")
def dashboard_summary():
    """
    Aggregated KPI summary for the Control Centre dashboard.
    Uses raw SQL COUNT queries to avoid ORM column mapping issues across DB versions.
    """
    import datetime
    import traceback

    try:
        from database import SessionLocal
        from sqlalchemy import text as sql_text

        db = SessionLocal()
        now = datetime.datetime.utcnow()

        def count(query: str, params: dict = {}) -> int:
            result = db.execute(sql_text(query), params)
            row = result.fetchone()
            return row[0] if row else 0

        # Infrastructure counts (safe raw SQL — no ORM column mapping)
        total_zones = count("SELECT COUNT(*) FROM zones")
        total_divisions = count("SELECT COUNT(*) FROM divisions")
        total_stations = count("SELECT COUNT(*) FROM stations")
        total_sources = count("SELECT COUNT(*) FROM water_sources")

        # Water Quality Status
        compliant = count("SELECT COUNT(*) FROM water_sources WHERE current_status = 'COMPLIANT'")
        due = count("SELECT COUNT(*) FROM water_sources WHERE current_status = 'DUE'")
        overdue = count("SELECT COUNT(*) FROM water_sources WHERE current_status = 'OVERDUE'")
        unfit = count("SELECT COUNT(*) FROM water_sources WHERE current_status = 'UNFIT'")
        persistent_failure = count("SELECT COUNT(*) FROM water_sources WHERE current_status = 'PERSISTENT_FAILURE'")
        unsatisfactory = count("SELECT COUNT(*) FROM water_sources WHERE current_status = 'UNSATISFACTORY'")

        # Operations
        open_alerts = count("SELECT COUNT(*) FROM alerts WHERE status = 'OPEN'")
        escalated_alerts = count("SELECT COUNT(*) FROM alerts WHERE status = 'ESCALATED'")
        open_cas = count("SELECT COUNT(*) FROM corrective_actions WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')")

        # Disinfection due
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        disinfection_due = count(
            "SELECT COUNT(*) FROM water_sources WHERE next_disinfection_due IS NOT NULL AND next_disinfection_due <= :now",
            {"now": now_str}
        )

        # Repeat samples pending
        repeat_pending = count("SELECT COUNT(*) FROM repeat_samples WHERE status IN ('DUE', 'COLLECTED')")

        # Recent alerts (last 10) — raw SQL to avoid ORM mapping issues
        alerts_rows = db.execute(sql_text(
            "SELECT id, alert_id, severity, status, source_id_code, station_name, zone_name, sample_result, created_at "
            "FROM alerts ORDER BY created_at DESC LIMIT 10"
        )).fetchall()
        recent_alert_data = [
            {
                "id": r[0], "alert_id": r[1], "severity": r[2], "status": r[3],
                "source_id_code": r[4], "station_name": r[5], "zone_name": r[6],
                "sample_result": r[7], "created_at": str(r[8]) if r[8] else None,
            }
            for r in alerts_rows
        ]

        # Recent lab reports (last 10)
        report_rows = db.execute(sql_text(
            "SELECT id, report_id, overall_result, report_date, created_at "
            "FROM lab_reports WHERE evaluation_done = 1 OR evaluation_done = TRUE "
            "ORDER BY created_at DESC LIMIT 10"
        )).fetchall()
        recent_report_data = [
            {
                "id": r[0], "report_id": r[1], "overall_result": r[2],
                "report_date": str(r[3]) if r[3] else None,
                "created_at": str(r[4]) if r[4] else None,
            }
            for r in report_rows
        ]

        db.close()

        return {
            "infrastructure": {
                "zones": total_zones,
                "divisions": total_divisions,
                "stations": total_stations,
                "water_sources": total_sources,
            },
            "water_quality": {
                "compliant": compliant,
                "due": due,
                "overdue": overdue,
                "unfit": unfit,
                "persistent_failure": persistent_failure,
                "unsatisfactory": unsatisfactory,
            },
            "operations": {
                "open_alerts": open_alerts,
                "escalated_alerts": escalated_alerts,
                "open_corrective_actions": open_cas,
                "disinfection_due": disinfection_due,
                "repeat_samples_pending": repeat_pending,
            },
            "recent_alerts": recent_alert_data,
            "recent_lab_reports": recent_report_data,
            "generated_at": now.isoformat(),
        }

    except Exception as e:
        logger.error("Dashboard summary error: %s", traceback.format_exc())
        return {
            "error": f"{type(e).__name__}: {str(e)}",
            "infrastructure": {"zones": 0, "divisions": 0, "stations": 0, "water_sources": 0},
            "water_quality": {"compliant": 0, "due": 0, "overdue": 0, "unfit": 0, "persistent_failure": 0, "unsatisfactory": 0},
            "operations": {"open_alerts": 0, "escalated_alerts": 0, "open_corrective_actions": 0, "disinfection_due": 0, "repeat_samples_pending": 0},
            "recent_alerts": [],
            "recent_lab_reports": [],
        }
