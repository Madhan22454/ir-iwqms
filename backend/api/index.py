import os
import sys

# Add the parent directory to sys.path so we can import main
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import app

# Add a catch-all route for debugging the path
from fastapi import Request
from fastapi.responses import JSONResponse

@app.middleware("http")
async def debug_path_middleware(request: Request, call_next):
    print(f"DEBUG: Vercel passed path: {request.scope.get('path')}")
    if request.scope.get("path") == "/debug":
        return JSONResponse(
            content={
                "url": str(request.url),
                "scope_path": request.scope.get("path"),
                "raw_path": request.scope.get("raw_path", b"").decode("utf-8")
            }
        )
    response = await call_next(request)
    return response
