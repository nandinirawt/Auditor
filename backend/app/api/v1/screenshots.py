"""Real screenshot capture endpoint.

POST /api/v1/screenshots  { "url": "https://example.com" }
-> visits the site in a headless browser and returns image URLs for
   desktop, tablet and mobile full-page captures.

No auth required: this powers the public "paste a URL and see it" flow.
"""
from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl

from app.services.audit import store
from app.services.audit.screenshots import CaptureError, capture_screenshots

router = APIRouter(prefix="/screenshots", tags=["screenshots"])


class ScreenshotRequest(BaseModel):
    url: HttpUrl


class ShotOut(BaseModel):
    device: str
    url: str
    width: int | None = None
    file_size: int | None = None


class PageOut(BaseModel):
    url: str
    path: str
    title: str | None = None
    screenshot: str
    accessibility_score: int | None = None
    issues: int | None = None


class ScreenshotResponse(BaseModel):
    token: str
    url: str
    final_url: str
    title: str
    screenshots: list[ShotOut]
    accessibility: dict | None = None
    pages: list[PageOut] = []
    performance: dict | None = None
    seo: dict | None = None
    ux: dict | None = None
    structure: dict | None = None
    overall: int | None = None


@router.post("", response_model=ScreenshotResponse, summary="Capture screenshots of a URL")
async def create_screenshots(payload: ScreenshotRequest, request: Request) -> ScreenshotResponse:
    try:
        result = await capture_screenshots(str(payload.url))
    except CaptureError as exc:
        message = str(exc)
        if "playwright_not_installed" in message:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Screenshot engine isn't installed. In the backend virtualenv run: "
                    "pip install playwright && playwright install chromium"
                ),
            )
        if message.startswith("navigation_failed"):
            raise HTTPException(
                status_code=502,
                detail="Couldn't open that website. Check the URL is reachable and try again.",
            )
        raise HTTPException(status_code=502, detail=f"Couldn't capture this site ({message}).")

    base = str(request.base_url).rstrip("/")
    shots = [
        ShotOut(
            device=s["device"],
            url=f"{base}/static/{s['rel_path']}",
            width=s.get("width"),
            file_size=s.get("file_size"),
        )
        for s in result["shots"]
    ]

    token = result["token"]
    try:
        domain = urlparse(result.get("final_url") or result["url"]).hostname or ""
        domain = domain.replace("www.", "")
    except Exception:
        domain = ""
    desktop_url = next((s.url for s in shots if s.device == "desktop"), shots[0].url if shots else None)

    pages = [
        PageOut(
            url=pg["url"],
            path=pg["path"],
            title=pg.get("title"),
            screenshot=f"{base}/static/{pg['rel_path']}",
            accessibility_score=pg.get("accessibility_score"),
            issues=pg.get("issues"),
        )
        for pg in result.get("pages", [])
    ]

    # Persist the audit so the Studio + History endpoints can use it later.
    try:
        store.save_audit(token, {
            "token": token,
            "url": result["url"],
            "final_url": result["final_url"],
            "domain": domain,
            "title": result["title"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "desktop_screenshot": desktop_url,
            "screenshots": [s.model_dump() for s in shots],
            "accessibility": result.get("accessibility"),
            "pages": [p.model_dump() for p in pages],
            "performance": result.get("performance"),
            "seo": result.get("seo"),
            "ux": result.get("ux"),
            "structure": result.get("structure"),
            "overall": result.get("overall"),
        })
    except Exception:
        pass

    return ScreenshotResponse(
        token=token,
        url=result["url"],
        final_url=result["final_url"],
        title=result["title"],
        screenshots=shots,
        accessibility=result.get("accessibility"),
        pages=pages,
        performance=result.get("performance"),
        seo=result.get("seo"),
        ux=result.get("ux"),
        structure=result.get("structure"),
        overall=result.get("overall"),
    )
