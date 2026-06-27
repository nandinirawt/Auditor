"""Aggregate v1 router."""
from fastapi import APIRouter

from app.api.v1 import auth, projects, screenshots, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(screenshots.router)
# Full audit, findings, reports, ws routers mount here in later phases.
