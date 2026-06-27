from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.enums import AuditStatus, DeviceType


class Audit(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audits"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False
    )

    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255), index=True)
    category: Mapped[str | None] = mapped_column(String(100))
    device: Mapped[DeviceType] = mapped_column(
        Enum(DeviceType), default=DeviceType.desktop, nullable=False
    )

    status: Mapped[AuditStatus] = mapped_column(
        Enum(AuditStatus), default=AuditStatus.queued, index=True, nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_stage: Mapped[str | None] = mapped_column(String(100))
    error_message: Mapped[str | None] = mapped_column(Text)

    overall_score: Mapped[int | None] = mapped_column(Integer)
    accessibility_score: Mapped[int | None] = mapped_column(Integer)
    performance_score: Mapped[int | None] = mapped_column(Integer)
    seo_score: Mapped[int | None] = mapped_column(Integer)
    best_practices_score: Mapped[int | None] = mapped_column(Integer)
    wcag_score: Mapped[int | None] = mapped_column(Integer)

    started_at: Mapped[datetime | None] = mapped_column()
    finished_at: Mapped[datetime | None] = mapped_column()

    user: Mapped["User"] = relationship(back_populates="audits")
    project: Mapped["Project"] = relationship(back_populates="audits")
    pages: Mapped[list["Page"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    screenshots: Mapped[list["Screenshot"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    findings: Mapped[list["Finding"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    accessibility_reports: Mapped[list["AccessibilityReport"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    performance_reports: Mapped[list["PerformanceReport"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    wcag_reports: Mapped[list["WCAGReport"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        back_populates="audit", cascade="all, delete-orphan"
    )
