from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.enums import ReportFormat


class Report(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reports"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    format: Mapped[ReportFormat] = mapped_column(Enum(ReportFormat), nullable=False)
    path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer)

    audit: Mapped["Audit"] = relationship(back_populates="reports")
