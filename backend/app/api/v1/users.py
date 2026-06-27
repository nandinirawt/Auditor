"""User self-service routes."""
from fastapi import APIRouter

from app.api.deps import ActiveUser, DBSession
from app.schemas.user import UserRead, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: ActiveUser):
    return user


@router.patch("/me", response_model=UserRead)
async def update_me(data: UserUpdate, db: DBSession, user: ActiveUser):
    return await user_service.update_user(db, user, data)
