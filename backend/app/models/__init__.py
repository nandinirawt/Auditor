"""Import all models so they register on Base.metadata (Alembic + relationships)."""
from app.core.database import Base
from app.models.accessibility_report import AccessibilityReport
from app.models.activity_log import ActivityLog
from app.models.audit import Audit
from app.models.finding import Finding
from app.models.notification import Notification
from app.models.page import Page
from app.models.performance_report import PerformanceReport
from app.models.project import Project
from app.models.report import Report
from app.models.screenshot import Screenshot
from app.models.settings import UserSettings
from app.models.user import User
from app.models.wcag_report import WCAGReport

__all__ = [
    "Base",
    "User",
    "Project",
    "Audit",
    "Page",
    "Screenshot",
    "Finding",
    "AccessibilityReport",
    "PerformanceReport",
    "WCAGReport",
    "Report",
    "ActivityLog",
    "UserSettings",
    "Notification",
]
