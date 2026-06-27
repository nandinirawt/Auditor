"""Reusable FastAPI dependencies: DB session, auth, pagination."""
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Query
from fastapi.security import OAuth2PasswordBearer
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.redis import get_redis
from app.core.security import TOKEN_TYPE_ACCESS, decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

DBSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[Redis, Depends(get_redis)]


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: DBSession
) -> User:
    payload = decode_token(token)
    if not payload or payload.get("type") != TOKEN_TYPE_ACCESS:
        raise AuthError("Invalid or expired access token")
    subject = payload.get("sub")
    try:
        user_id = UUID(subject)
    except (ValueError, TypeError):
        raise AuthError("Malformed token subject")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthError("User no longer exists")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_user(user: CurrentUser) -> User:
    if not user.is_active:
        raise ForbiddenError("Inactive user account")
    return user


ActiveUser = Annotated[User, Depends(get_current_active_user)]


class Pagination:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="1-indexed page number"),
        size: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size
        self.limit = size


PageParams = Annotated[Pagination, Depends()]
