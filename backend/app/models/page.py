from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Page(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "pages"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    path: Mapped[str] = mapped_column(String(1024), nullable=False)
    title: Mapped[str | None] = mapped_column(String(512))
    depth: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    step_order: Mapped[int | None] = mapped_column(Integer)
    load_time_ms: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), default="ok", nullable=False)

    # Crawler-extracted structure
    num_links: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    num_images: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    num_forms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    num_buttons: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    num_headings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    has_nav: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    meta: Mapped[dict | None] = mapped_column(JSON)

    audit: Mapped["Audit"] = relationship(back_populates="pages")
    screenshots: Mapped[list["Screenshot"]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )
    findings: Mapped[list["Finding"]] = relationship(back_populates="page")
