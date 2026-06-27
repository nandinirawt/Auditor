"""Aggregate v1 router."""
from fastapi import APIRouter

from app.api.v1 import auth, history, projects, screenshots, studio, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(screenshots.router)
api_router.include_router(studio.router)
api_router.include_router(history.router)
