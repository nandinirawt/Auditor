from __future__ import annotations

import uuid

from sqlalchemy import Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class PerformanceReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "performance_reports"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    page_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), index=True
    )
    performance_score: Mapped[int | None] = mapped_column(Integer)
    accessibility_score: Mapped[int | None] = mapped_column(Integer)
    seo_score: Mapped[int | None] = mapped_column(Integer)
    best_practices_score: Mapped[int | None] = mapped_column(Integer)

    lcp_ms: Mapped[int | None] = mapped_column(Integer)
    fcp_ms: Mapped[int | None] = mapped_column(Integer)
    tbt_ms: Mapped[int | None] = mapped_column(Integer)
    tti_ms: Mapped[int | None] = mapped_column(Integer)
    speed_index_ms: Mapped[int | None] = mapped_column(Integer)
    cls: Mapped[float | None] = mapped_column(Float)
    raw: Mapped[dict | None] = mapped_column(JSON)

    audit: Mapped["Audit"] = relationship(back_populates="performance_reports")
