"""Audit History + trends APIs.

Backs the History page and the audit selector. Reads the persisted audits from
the store and returns lightweight summaries; the full payload (for loading a past
audit back into every page) comes from GET /audits/{token}.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.services.audit import store

router = APIRouter(prefix="/audits", tags=["history"])


def _w3c_url(name: str) -> str | None:
    if not name or name.startswith("Success criterion"):
        return None
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower().replace("(", "").replace(")", "")).strip("-")
    return f"https://www.w3.org/WAI/WCAG22/Understanding/{slug}.html"


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
    score = acc.get("score")
    compliance = (acc.get("wcag") or {}).get("compliance")
    overall = a.get("overall")
    if overall is None:
        overall = acc.get("overall")
    if overall is None and score is not None:
        overall = round(0.6 * score + 0.4 * (compliance if compliance is not None else score))
    return {
        "token": a.get("token"),
        "url": a.get("url"),
        "final_url": a.get("final_url"),
        "domain": a.get("domain"),
        "title": a.get("title"),
        "created_at": _created(a),
        "overall": overall,
        "accessibility_score": score,
        "wcag_compliance": compliance,
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


@router.get("/{token}/wcag", summary="WCAG report for an audit, with trend vs previous")
async def wcag_report(token: str):
    audits = store.list_audits()
    cur = next((a for a in audits if a.get("token") == token), None)
    if cur is None:
        cur = store.load_audit(token)
        if cur is None:
            raise HTTPException(404, "Audit not found.")
    acc = cur.get("accessibility") or {}
    wcag = dict(acc.get("wcag") or {})

    # Enrich criteria with official W3C + Deque links (Deque from the matching rule).
    help_by_sc: dict[str, str] = {}
    for f in acc.get("findings") or []:
        sc = f.get("wcag")
        if sc and f.get("help") and sc not in help_by_sc:
            help_by_sc[sc] = f.get("help")
    crits = []
    for c in wcag.get("criteria") or []:
        c2 = dict(c)
        link = _w3c_url(c2.get("name") or "")
        if link:
            c2["w3c_url"] = link
        if c2.get("status") == "fail" and help_by_sc.get(c2.get("id")):
            c2["deque_url"] = help_by_sc[c2["id"]]
        crits.append(c2)
    wcag["criteria"] = crits

    # Trend vs the previous audit of the SAME domain.
    trend = None
    domain = cur.get("domain")
    cur_m = cur.get("_mtime", 0)
    prev = None
    for a in audits:
        if a.get("domain") == domain and a.get("_mtime", 0) < cur_m:
            if prev is None or a.get("_mtime", 0) > prev.get("_mtime", 0):
                prev = a
    if prev:
        pw = (prev.get("accessibility") or {}).get("wcag") or {}
        prev_p = {p["label"]: p for p in (pw.get("principles") or [])}
        per = []
        for p in wcag.get("principles") or []:
            pp = prev_p.get(p["label"])
            if pp and pp.get("total") and p.get("total"):
                cur_rate = p["passed"] / p["total"] * 100
                prev_rate = pp["passed"] / pp["total"] * 100
                per.append({"label": p["label"], "delta": round(cur_rate - prev_rate)})
            else:
                per.append({"label": p["label"], "delta": None})
        trend = {
            "prev_token": prev.get("token"),
            "prev_date": _created(prev),
            "compliance_delta": (wcag.get("compliance") or 0) - (pw.get("compliance") or 0),
            "principles": per,
        }

    return {"wcag": wcag, "trend": trend, "score": acc.get("score"), "domain": domain}
