from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.enums import DeviceType, WCAGLevel


class UserSettings(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    default_device: Mapped[DeviceType] = mapped_column(
        Enum(DeviceType), default=DeviceType.desktop, nullable=False
    )
    default_category: Mapped[str | None] = mapped_column(String(100))
    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)
    wcag_level: Mapped[WCAGLevel] = mapped_column(
        Enum(WCAGLevel), default=WCAGLevel.AA, nullable=False
    )
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    weekly_digest: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="settings")
