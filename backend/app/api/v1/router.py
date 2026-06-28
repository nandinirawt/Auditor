"""Aggregate v1 router."""
from fastapi import APIRouter

from app.api.v1 import auth, benchmark, history, projects, screenshots, studio, users, voice

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(screenshots.router)
api_router.include_router(studio.router)
api_router.include_router(history.router)
api_router.include_router(benchmark.router)
api_router.include_router(voice.router)
