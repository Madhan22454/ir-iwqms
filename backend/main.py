import sys
import os
import traceback

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from core.config import settings

    # Import ALL models first so SQLAlchemy registers them before create_all
    from models import user, hierarchy, master, lab, alert, workflow, audit  # noqa
    from database import Base, engine

    # Tables are managed by the seed script, do not create them on every serverless invocation

    from api import auth, hierarchy as hierarchy_api, master as master_api
    from api import healthcard, users, labs, alerts, workflow as workflow_api

    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Indian Railways Integrated Water Quality Monitoring & Surveillance System",
        version="2.0.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # CORS
    cors_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Core auth
    app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])

    # Hierarchy
    app.include_router(hierarchy_api.router,
                       prefix=f"{settings.API_V1_STR}/hierarchy", tags=["hierarchy"])

    # Master data
    app.include_router(master_api.router,
                       prefix=f"{settings.API_V1_STR}/master", tags=["master"])

    # Health card (legacy endpoint, keep for compatibility)
    app.include_router(healthcard.router,
                       prefix=f"{settings.API_V1_STR}/health", tags=["healthcard"])

    # Users
    app.include_router(users.router,
                       prefix=f"{settings.API_V1_STR}/users", tags=["users"])

    # Laboratory: labs, samples, reports + auto-evaluation
    app.include_router(labs.router,
                       prefix=f"{settings.API_V1_STR}/labs", tags=["laboratory"])

    # Alerts: list, filter, detail, acknowledge, notice
    app.include_router(alerts.router,
                       prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])

    # Workflow: corrective actions, repeat samples, verifications, escalations, audit, notifications
    app.include_router(workflow_api.router,
                       prefix=f"{settings.API_V1_STR}/workflow", tags=["workflow"])

    @app.get("/")
    def read_root():
        return {
            "message": "Welcome to IR-IWQMS API v2.0",
            "docs": "/docs",
            "version": "2.0.0",
        }

    @app.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "application": "IR-IWQMS API"
        }

    from fastapi import Request
    @app.route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    async def catch_all_debug(request: Request, path: str):
        return {"debug_path": path, "url": str(request.url), "scope_path": request.scope.get("path")}

except Exception as e:
    err_trace = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse
    
    app = FastAPI()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"])
    def catch_all(path: str):
        return PlainTextResponse(f"Initialization Error:\n{err_trace}", status_code=500)

