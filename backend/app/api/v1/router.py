"""Aggregate v1 router."""
from fastapi import APIRouter

from app.api.v1 import auth, projects, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
# Audit, findings, reports, screenshots, ws routers mount here in Phase 3.
