"""On-disk store for audit results and rendered previews, keyed by token.

JSON files under backend/data/. No database needed; this is the persistence
layer behind Audit History and the audit selector.
"""
from __future__ import annotations

import json
from pathlib import Path

_BASE = Path(__file__).resolve().parents[3] / "data"
_AUDIT_DIR = _BASE / "audits"
_PREVIEW_DIR = _BASE / "previews"
_BENCH_DIR = _BASE / "benchmarks"


def _safe(s: str) -> str:
    return "".join(c for c in (s or "") if c.isalnum() or c in "-_")


def save_audit(token: str, payload: dict) -> None:
    _AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    (_AUDIT_DIR / f"{_safe(token)}.json").write_text(json.dumps(payload), encoding="utf-8")


def load_audit(token: str) -> dict | None:
    p = _AUDIT_DIR / f"{_safe(token)}.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def list_audits() -> list[dict]:
    """All stored audits, each annotated with its file mtime as _mtime."""
    if not _AUDIT_DIR.exists():
        return []
    out = []
    for p in _AUDIT_DIR.glob("*.json"):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        try:
            data["_mtime"] = p.stat().st_mtime
        except Exception:
            data["_mtime"] = 0
        out.append(data)
    return out


def delete_audit(token: str) -> bool:
    p = _AUDIT_DIR / f"{_safe(token)}.json"
    existed = p.exists()
    try:
        p.unlink(missing_ok=True)
    except Exception:
        pass
    # Clean up any cached previews for this audit too.
    if _PREVIEW_DIR.exists():
        for pv in _PREVIEW_DIR.glob(f"{_safe(token)}__*.json"):
            try:
                pv.unlink()
            except Exception:
                pass
    return existed


def find_issue(audit: dict, issue_id: str) -> dict | None:
    findings = (audit.get("accessibility") or {}).get("findings") or []
    for f in findings:
        if (f.get("id") or f.get("category")) == issue_id:
            return f
    return None


def save_preview(token: str, issue_id: str, payload: dict) -> None:
    _PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    (_PREVIEW_DIR / f"{_safe(token)}__{_safe(issue_id)}.json").write_text(json.dumps(payload), encoding="utf-8")


def load_preview(token: str, issue_id: str) -> dict | None:
    p = _PREVIEW_DIR / f"{_safe(token)}__{_safe(issue_id)}.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_benchmark(base_token: str, payload: dict) -> None:
    _BENCH_DIR.mkdir(parents=True, exist_ok=True)
    (_BENCH_DIR / f"{_safe(base_token)}.json").write_text(json.dumps(payload), encoding="utf-8")


def load_benchmark(base_token: str) -> dict | None:
    p = _BENCH_DIR / f"{_safe(base_token)}.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None
