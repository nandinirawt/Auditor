"""Enumerations shared across models and schemas."""
import enum


class DeviceType(str, enum.Enum):
    desktop = "desktop"
    tablet = "tablet"
    mobile = "mobile"


class AuditStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    canceled = "canceled"


class ScreenshotKind(str, enum.Enum):
    full_page = "full_page"
    viewport = "viewport"
    element = "element"


class FindingSeverity(str, enum.Enum):
    critical = "critical"
    serious = "serious"
    moderate = "moderate"
    minor = "minor"


class FindingSource(str, enum.Enum):
    axe = "axe"
    lighthouse = "lighthouse"
    heuristic = "heuristic"


class FindingStatus(str, enum.Enum):
    open = "open"
    in_review = "in_review"
    resolved = "resolved"


class WCAGPrinciple(str, enum.Enum):
    perceivable = "perceivable"
    operable = "operable"
    understandable = "understandable"
    robust = "robust"


class WCAGLevel(str, enum.Enum):
    A = "A"
    AA = "AA"
    AAA = "AAA"


class ReportFormat(str, enum.Enum):
    html = "html"
    pdf = "pdf"
    json = "json"
