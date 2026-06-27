from __future__ import annotations

import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.enums import FindingSeverity, FindingSource, FindingStatus, WCAGLevel


class Finding(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "findings"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    page_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("pages.id", ondelete="SET NULL"), index=True
    )
    code: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[FindingSeverity] = mapped_column(
        Enum(FindingSeverity), index=True, nullable=False
    )
    category: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[FindingSource] = mapped_column(Enum(FindingSource), nullable=False)
    selector: Mapped[str | None] = mapped_column(Text)
    html_snippet: Mapped[str | None] = mapped_column(Text)
    help_url: Mapped[str | None] = mapped_column(String(1024))
    wcag_criterion: Mapped[str | None] = mapped_column(String(20), index=True)
    wcag_level: Mapped[WCAGLevel | None] = mapped_column(Enum(WCAGLevel))
    status: Mapped[FindingStatus] = mapped_column(
        Enum(FindingStatus), default=FindingStatus.open, nullable=False
    )

    audit: Mapped["Audit"] = relationship(back_populates="findings")
    page: Mapped["Page"] = relationship(back_populates="findings")
