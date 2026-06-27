from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.enums import WCAGPrinciple


class WCAGReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "wcag_reports"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    principle: Mapped[WCAGPrinciple] = mapped_column(Enum(WCAGPrinciple), nullable=False)
    score: Mapped[int | None] = mapped_column(Integer)
    passed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    audit: Mapped["Audit"] = relationship(back_populates="wcag_reports")
