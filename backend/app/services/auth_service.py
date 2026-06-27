"""Authentication business logic: registration, login, token rotation."""
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthError, ConflictError, ForbiddenError
from app.core.security import (
    TOKEN_TYPE_REFRESH,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    seconds_until_expiry,
    verify_password,
)
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.services import user_service

_DENYLIST_PREFIX = "denylist:jti:"


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    if await user_service.get_by_email(db, data.email):
        raise ConflictError("An account with this email already exists")
    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        settings=UserSettings(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await user_service.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise AuthError("Incorrect email or password")
    if not user.is_active:
        raise ForbiddenError("This account is inactive")
    return user


def issue_tokens(user: User) -> dict[str, str]:
    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": create_refresh_token(str(user.id)),
    }


async def refresh_tokens(db: AsyncSession, redis: Redis, refresh_token: str) -> dict[str, str]:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != TOKEN_TYPE_REFRESH:
        raise AuthError("Invalid refresh token")

    jti = payload.get("jti")
    if jti and await redis.exists(f"{_DENYLIST_PREFIX}{jti}"):
        raise AuthError("Refresh token has been revoked")

    user = await user_service.get_by_id(db, UUID(payload["sub"]))
    if not user or not user.is_active:
        raise AuthError("User is unavailable")

    # Rotate: revoke the just-used refresh token for the remainder of its life.
    if jti:
        ttl = seconds_until_expiry(payload)
        if ttl > 0:
            await redis.setex(f"{_DENYLIST_PREFIX}{jti}", ttl, "1")

    return issue_tokens(user)


async def logout(redis: Redis, refresh_token: str) -> None:
    payload = decode_token(refresh_token)
    if not payload:
        return
    jti = payload.get("jti")
    ttl = seconds_until_expiry(payload)
    if jti and ttl > 0:
        await redis.setex(f"{_DENYLIST_PREFIX}{jti}", ttl, "1")
