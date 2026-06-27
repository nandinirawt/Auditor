"""Authentication routes."""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import ActiveUser, DBSession, RedisClient
from app.schemas.auth import RefreshRequest, RegisterRequest, Token
from app.schemas.common import Message
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: DBSession):
    """Create a new account."""
    return await auth_service.register(db, data)


@router.post("/login", response_model=Token)
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DBSession):
    """Exchange email (as `username`) + password for access + refresh tokens."""
    user = await auth_service.authenticate(db, form.username, form.password)
    return auth_service.issue_tokens(user)


@router.post("/refresh", response_model=Token)
async def refresh(data: RefreshRequest, db: DBSession, redis: RedisClient):
    """Rotate a refresh token for a fresh access + refresh pair."""
    return await auth_service.refresh_tokens(db, redis, data.refresh_token)


@router.post("/logout", response_model=Message)
async def logout(data: RefreshRequest, redis: RedisClient):
    """Revoke a refresh token."""
    await auth_service.logout(redis, data.refresh_token)
    return Message(message="Logged out")


@router.get("/me", response_model=UserRead)
async def me(user: ActiveUser):
    """Return the authenticated user."""
    return user
