from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class ActivityLog(UUIDMixin, TimestampMixin, Base):
    """Per-user activity / audit history feed."""

    __tablename__ = "activity_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    audit_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("audits.id", ondelete="SET NULL"), index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str | None] = mapped_column(String(512))
    meta: Mapped[dict | None] = mapped_column(JSON)

    user: Mapped["User"] = relationship(back_populates="activity_logs")
