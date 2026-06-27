"""AI Studio pipeline — Recommendations, Generated Code, Before/After (live render).

All endpoints consume the SAME stored audit (by token) and the SAME issue object,
so selecting an issue drives code AND the live before/after render. The render
endpoint actually re-loads the page, injects the fix, re-screenshots and re-scans.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.services.audit import store
from app.services.audit.preview import PreviewError, render_preview
from app.services.audit.remediation import (
    build_before_after,
    build_code_fix,
    build_recommendations,
)

router = APIRouter(prefix="/audits", tags=["studio"])


def _load_or_404(token: str) -> dict:
    audit = store.load_audit(token)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found. Re-run the audit to generate it.")
    return audit


def _issue_or_404(audit: dict, issue_id: str) -> dict:
    issue = store.find_issue(audit, issue_id)
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found in this audit.")
    return issue


@router.get("/{token}/recommendations", summary="Recommendations for an audit")
async def get_recommendations(token: str):
    audit = _load_or_404(token)
    issues = (audit.get("accessibility") or {}).get("findings") or []
    result = build_recommendations(issues)
    result.update({"token": token, "url": audit.get("url"), "domain": audit.get("domain"),
                   "screenshot": audit.get("desktop_screenshot")})
    return result


@router.get("/{token}/code/{issue_id}", summary="Generated code for one issue")
async def get_code(token: str, issue_id: str):
    audit = _load_or_404(token)
    return build_code_fix(_issue_or_404(audit, issue_id))


@router.get("/{token}/before-after/{issue_id}", summary="Before/after metrics (no render)")
async def get_before_after(token: str, issue_id: str):
    audit = _load_or_404(token)
    issue = _issue_or_404(audit, issue_id)
    base = (audit.get("accessibility") or {}).get("score")
    result = build_before_after(issue, base_score=base)
    result["screenshot"] = audit.get("desktop_screenshot")
    return result


def _preview_error(exc: PreviewError):
    msg = str(exc)
    if "playwright_not_installed" in msg:
        return HTTPException(503, "Render engine isn't installed. Run: pip install playwright && playwright install chromium")
    if msg == "element_not_found":
        return HTTPException(422, "Couldn't locate the affected element on the live page (it may be dynamic or removed).")
    if msg.startswith("navigation_failed"):
        return HTTPException(502, "Couldn't reopen the website to render the preview.")
    if msg == "missing_url_or_selector":
        return HTTPException(422, "This issue has no selector to render.")
    return HTTPException(502, f"Couldn't render the preview ({msg}).")


def _build_preview_response(token: str, audit: dict, issue: dict, render: dict, request: Request) -> dict:
    base = str(request.base_url).rstrip("/")
    acc = audit.get("accessibility") or {}
    acc_before = acc.get("score")
    wcag_before = (acc.get("wcag") or {}).get("compliance")
    viol_before = (acc.get("stats") or {}).get("violations")

    meta = build_before_after(issue, base_score=acc_before)
    code = build_code_fix(issue)

    acc_after = render.get("after_score")
    wcag_after = render.get("after_wcag_compliance")
    viol_after = render.get("after_violations")

    return {
        "issue_id": issue.get("id"),
        "title": issue.get("title"),
        "summary": meta["summary"],
        "category": meta["category"],
        "selector": issue.get("selector"),
        "applied": render.get("applied"),
        "notes": render.get("notes", []),
        "bbox": render.get("bbox"),
        "before_image": f"{base}/static/{render['before_rel']}",
        "after_image": f"{base}/static/{render['after_rel']}",
        "metrics": {
            "accessibility_before": acc_before,
            "accessibility_after": acc_after if acc_after is not None else acc_before,
            "wcag_before": wcag_before,
            "wcag_after": wcag_after if wcag_after is not None else wcag_before,
            "violations_before": viol_before,
            "violations_after": viol_after if viol_after is not None else viol_before,
            "ux_before": meta["original_ux_score"],
            "ux_after": meta["new_ux_score"],
        },
        "code": code,
        "improvement_summary": meta["improvement_summary"],
        "highlights": meta["highlights"],
        "generated_by": "live-render",
    }


@router.post("/{token}/preview/{issue_id}", summary="Render a live before/after for one issue")
async def render_preview_endpoint(token: str, issue_id: str, request: Request):
    audit = _load_or_404(token)
    issue = dict(_issue_or_404(audit, issue_id))
    issue["_url"] = audit.get("final_url") or audit.get("url")
    try:
        render = await render_preview(token, issue)
    except PreviewError as exc:
        raise _preview_error(exc)
    response = _build_preview_response(token, audit, issue, render, request)
    try:
        store.save_preview(token, issue_id, response)
    except Exception:
        pass
    return response


@router.get("/{token}/preview/{issue_id}", summary="Get the last rendered preview (cached)")
async def get_preview(token: str, issue_id: str):
    cached = store.load_preview(token, issue_id)
    if cached is None:
        raise HTTPException(404, "No preview rendered yet for this issue.")
    return cached
