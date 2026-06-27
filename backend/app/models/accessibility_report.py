from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class AccessibilityReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "accessibility_reports"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    page_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("pages.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[int | None] = mapped_column(Integer)
    violations: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    passes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    incomplete: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    inapplicable: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    raw: Mapped[dict | None] = mapped_column(JSON)

    audit: Mapped["Audit"] = relationship(back_populates="accessibility_reports")
