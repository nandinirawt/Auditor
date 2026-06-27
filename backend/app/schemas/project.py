"""Project schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.schemas.common import ORMModel


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    url: HttpUrl
    category: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    url: HttpUrl | None = None
    category: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class ProjectRead(ORMModel):
    id: UUID
    user_id: UUID
    name: str
    url: str
    domain: str | None
    category: str | None
    description: str | None
    created_at: datetime
    updated_at: datetime
