"""Audit History + trends APIs.

Backs the History page and the audit selector. Reads the persisted audits from
the store and returns lightweight summaries; the full payload (for loading a past
audit back into every page) comes from GET /audits/{token}.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.services.audit import store

router = APIRouter(prefix="/audits", tags=["history"])


def _created(a: dict) -> str | None:
    created = a.get("created_at")
    if not created and a.get("_mtime"):
        try:
            created = datetime.fromtimestamp(a["_mtime"], tz=timezone.utc).isoformat()
        except Exception:
            created = None
    return created


def _summary(a: dict) -> dict:
    acc = a.get("accessibility") or {}
    counts = acc.get("counts") or {}
    issues = (acc.get("stats") or {}).get("violations")
    if issues is None:
        issues = sum(counts.values()) if counts else 0
    return {
        "token": a.get("token"),
        "url": a.get("url"),
        "final_url": a.get("final_url"),
        "domain": a.get("domain"),
        "title": a.get("title"),
        "created_at": _created(a),
        "accessibility_score": acc.get("score"),
        "wcag_compliance": (acc.get("wcag") or {}).get("compliance"),
        "issues": issues,
        "critical": counts.get("critical", 0),
        "screenshots": len(a.get("screenshots") or []),
        "screenshot": a.get("desktop_screenshot"),
    }


# NOTE: /trends is declared before /{token} so it isn't captured as a token.
@router.get("", summary="List audits (newest first)")
async def list_audits():
    audits = store.list_audits()
    audits.sort(key=lambda a: a.get("_mtime", 0), reverse=True)
    return {"count": len(audits), "audits": [_summary(a) for a in audits]}


@router.get("/trends", summary="Score trend across all audits (oldest first)")
async def trends():
    audits = store.list_audits()
    audits.sort(key=lambda a: a.get("_mtime", 0))
    series = []
    for a in audits:
        acc = a.get("accessibility") or {}
        series.append({
            "token": a.get("token"),
            "domain": a.get("domain"),
            "created_at": _created(a),
            "accessibility": acc.get("score"),
            "wcag": (acc.get("wcag") or {}).get("compliance"),
            "issues": (acc.get("stats") or {}).get("violations"),
        })
    return {"count": len(series), "series": series}


@router.get("/{token}", summary="Full stored audit (for loading into all pages)")
async def get_audit(token: str):
    a = store.load_audit(token)
    if a is None:
        raise HTTPException(404, "Audit not found.")
    a.pop("_mtime", None)
    return a


@router.delete("/{token}", summary="Delete an audit")
async def delete_audit(token: str):
    ok = store.delete_audit(token)
    if not ok:
        raise HTTPException(404, "Audit not found.")
    return {"deleted": True, "token": token}
