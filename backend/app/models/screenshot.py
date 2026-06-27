from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.enums import DeviceType, ScreenshotKind


class Screenshot(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "screenshots"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    page_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), index=True
    )
    device: Mapped[DeviceType] = mapped_column(Enum(DeviceType), nullable=False)
    kind: Mapped[ScreenshotKind] = mapped_column(Enum(ScreenshotKind), nullable=False)
    label: Mapped[str | None] = mapped_column(String(255))
    path: Mapped[str] = mapped_column(String(1024), nullable=False)
    thumb_path: Mapped[str | None] = mapped_column(String(1024))
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    file_size: Mapped[int | None] = mapped_column(Integer)

    audit: Mapped["Audit"] = relationship(back_populates="screenshots")
    page: Mapped["Page"] = relationship(back_populates="screenshots")
