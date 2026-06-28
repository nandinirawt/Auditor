"""Competitor Benchmark engine.

Audits competitor sites with the SAME real pipeline (Playwright + axe-core + WCAG)
as the user's own audit, one competitor per request, then compares the dimensions
we genuinely measure: accessibility score, WCAG conformance, and issue counts.

Honest limits: Performance/SEO comparison needs Lighthouse (not wired yet), and
large commercial sites often block automated scans — those return a clear error.
No Celery/Redis; each competitor is an awaited async scan.
"""
from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl

from app.services.audit import store
from app.services.audit.screenshots import CaptureError, capture_screenshots

router = APIRouter(prefix="/benchmark", tags=["benchmark"])

# Curated competitor suggestions by category. These are conveniences — note that
# large commercial sites frequently block automation, so a scan may fail.
_SUGGESTIONS = {
    "ecommerce": [
        {"name": "Amazon India", "url": "https://www.amazon.in"},
        {"name": "Flipkart", "url": "https://www.flipkart.com"},
        {"name": "Myntra", "url": "https://www.myntra.com"},
        {"name": "Ajio", "url": "https://www.ajio.com"},
        {"name": "Meesho", "url": "https://www.meesho.com"},
    ],
    "news": [
        {"name": "BBC", "url": "https://www.bbc.com"},
        {"name": "The Guardian", "url": "https://www.theguardian.com"},
        {"name": "NDTV", "url": "https://www.ndtv.com"},
        {"name": "The Hindu", "url": "https://www.thehindu.com"},
    ],
    "saas": [
        {"name": "Stripe", "url": "https://stripe.com"},
        {"name": "Notion", "url": "https://www.notion.so"},
        {"name": "Slack", "url": "https://slack.com"},
        {"name": "Figma", "url": "https://www.figma.com"},
    ],
    "education": [
        {"name": "Khan Academy", "url": "https://www.khanacademy.org"},
        {"name": "Coursera", "url": "https://www.coursera.org"},
        {"name": "MIT OCW", "url": "https://ocw.mit.edu"},
        {"name": "NPTEL", "url": "https://nptel.ac.in"},
    ],
    "government": [
        {"name": "India.gov.in", "url": "https://www.india.gov.in"},
        {"name": "MyGov", "url": "https://www.mygov.in"},
        {"name": "GOV.UK", "url": "https://www.gov.uk"},
        {"name": "USA.gov", "url": "https://www.usa.gov"},
    ],
    "healthcare": [
        {"name": "Mayo Clinic", "url": "https://www.mayoclinic.org"},
        {"name": "WebMD", "url": "https://www.webmd.com"},
        {"name": "NHS", "url": "https://www.nhs.uk"},
        {"name": "Apollo Hospitals", "url": "https://www.apollohospitals.com"},
    ],
    "finance": [
        {"name": "Zerodha", "url": "https://zerodha.com"},
        {"name": "Groww", "url": "https://groww.in"},
        {"name": "HDFC Bank", "url": "https://www.hdfcbank.com"},
        {"name": "Paytm", "url": "https://paytm.com"},
    ],
    "travel": [
        {"name": "MakeMyTrip", "url": "https://www.makemytrip.com"},
        {"name": "Booking.com", "url": "https://www.booking.com"},
        {"name": "Airbnb", "url": "https://www.airbnb.com"},
        {"name": "IRCTC", "url": "https://www.irctc.co.in"},
    ],
    "portfolio": [
        {"name": "Awwwards", "url": "https://www.awwwards.com"},
        {"name": "Dribbble", "url": "https://dribbble.com"},
        {"name": "Behance", "url": "https://www.behance.net"},
    ],
    "restaurant": [
        {"name": "Zomato", "url": "https://www.zomato.com"},
        {"name": "Swiggy", "url": "https://www.swiggy.com"},
        {"name": "McDonald's India", "url": "https://www.mcdelivery.co.in"},
    ],
}


class CompetitorRequest(BaseModel):
    url: HttpUrl
    category: str | None = None


def _summary(audit: dict) -> dict:
    acc = audit.get("accessibility") or {}
    counts = acc.get("counts") or {}
    snap = acc.get("snapshot") or {}
    issues = (acc.get("stats") or {}).get("violations")
    if issues is None:
        issues = sum(counts.values()) if counts else 0
    return {
        "token": audit.get("token"),
        "domain": audit.get("domain"),
        "url": audit.get("url"),
        "title": audit.get("title"),
        "screenshot": audit.get("desktop_screenshot"),
        "accessibility": acc.get("score"),
        "wcag": (acc.get("wcag") or {}).get("compliance"),
        "issues": issues,
        "critical": counts.get("critical", 0),
        "contrast": snap.get("contrast", 0),
        "altText": snap.get("altText", 0),
        "keyboard": snap.get("keyboard", 0),
    }


def _persist(result: dict, request: Request) -> dict:
    """Save a capture result as a normal audit (so it shows in history too)."""
    base = str(request.base_url).rstrip("/")
    shots = [{"device": s["device"], "url": f"{base}/static/{s['rel_path']}",
              "width": s.get("width"), "file_size": s.get("file_size")} for s in result["shots"]]
    try:
        domain = (urlparse(result.get("final_url") or result["url"]).hostname or "").replace("www.", "")
    except Exception:
        domain = ""
    desktop = next((s["url"] for s in shots if s["device"] == "desktop"), shots[0]["url"] if shots else None)
    payload = {
        "token": result["token"], "url": result["url"], "final_url": result["final_url"],
        "domain": domain, "title": result["title"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "desktop_screenshot": desktop, "screenshots": shots,
        "accessibility": result.get("accessibility"),
    }
    store.save_audit(result["token"], payload)
    return payload


def _insights(base: dict, comps: list[dict], avg: dict) -> list[str]:
    if not comps:
        return ["Add one or more competitors to benchmark against."]
    out: list[str] = []
    ranked = sorted([(base["domain"], base["accessibility"])] +
                    [(c["domain"], c["accessibility"]) for c in comps if c["accessibility"] is not None],
                    key=lambda x: -(x[1] or 0))
    if base["accessibility"] is not None and avg["accessibility"] is not None:
        d = base["accessibility"] - avg["accessibility"]
        if d > 0:
            out.append(f"Your accessibility score ({base['accessibility']}) is {d} points above the competitor average ({avg['accessibility']}).")
        elif d < 0:
            out.append(f"Your accessibility score ({base['accessibility']}) is {abs(d)} points below the competitor average ({avg['accessibility']}).")
        else:
            out.append(f"Your accessibility score matches the competitor average ({avg['accessibility']}).")
        rank = next((i + 1 for i, (dom, _) in enumerate(ranked) if dom == base["domain"]), None)
        if rank:
            out.append(f"You rank #{rank} of {len(ranked)} on accessibility.")
    worse = []
    for key, label in [("contrast", "colour-contrast issues"), ("altText", "missing alt-text"),
                       ("keyboard", "keyboard issues"), ("critical", "critical issues")]:
        if base.get(key) is not None and avg.get(key) is not None and base[key] > avg[key]:
            worse.append((base[key] - avg[key], label, base[key], avg[key]))
    worse.sort(reverse=True)
    if worse:
        _, label, b, a = worse[0]
        out.append(f"Largest improvement opportunity: {label} — you have {b} vs a competitor average of {a}.")
    if base.get("wcag") is not None and avg.get("wcag") is not None and base["wcag"] > avg["wcag"]:
        out.append(f"Your WCAG conformance ({base['wcag']}%) is better than the competitor average ({avg['wcag']}%).")
    return out


@router.get("/suggestions", summary="Suggested competitors for a category")
async def suggestions(category: str = ""):
    return {"category": category, "suggestions": _SUGGESTIONS.get(category.lower(), [])}


@router.post("/{base_token}/competitor", summary="Audit and add one competitor")
async def add_competitor(base_token: str, payload: CompetitorRequest, request: Request):
    if store.load_audit(base_token) is None:
        raise HTTPException(404, "Run your own audit first.")
    try:
        result = await capture_screenshots(str(payload.url))
    except CaptureError as exc:
        msg = str(exc)
        if "playwright_not_installed" in msg:
            raise HTTPException(503, "Browser engine isn't installed.")
        if msg.startswith("navigation_failed"):
            raise HTTPException(502, "Couldn't open that competitor (it may block automated scans).")
        raise HTTPException(502, f"Couldn't scan this competitor ({msg}).")

    saved = _persist(result, request)
    bench = store.load_benchmark(base_token) or {"base_token": base_token, "competitors": [],
                                                 "created_at": datetime.now(timezone.utc).isoformat()}
    if payload.category:
        bench["category"] = payload.category
    bench["competitors"] = [c for c in bench["competitors"] if c["token"] != saved["token"]]
    bench["competitors"].append({"token": saved["token"], "url": saved["url"], "domain": saved["domain"]})
    store.save_benchmark(base_token, bench)
    return _summary(saved)


@router.delete("/{base_token}/competitor/{token}", summary="Remove a competitor")
async def remove_competitor(base_token: str, token: str):
    bench = store.load_benchmark(base_token)
    if bench is None:
        raise HTTPException(404, "No benchmark found.")
    bench["competitors"] = [c for c in bench["competitors"] if c["token"] != token]
    store.save_benchmark(base_token, bench)
    return {"removed": True, "token": token}


@router.get("/{base_token}", summary="Benchmark comparison + insights")
async def get_benchmark(base_token: str):
    base_audit = store.load_audit(base_token)
    if base_audit is None:
        raise HTTPException(404, "Audit not found.")
    bench = store.load_benchmark(base_token) or {"competitors": []}
    comps = []
    for c in bench.get("competitors", []):
        a = store.load_audit(c["token"])
        if a:
            comps.append(_summary(a))
    base_sum = _summary(base_audit)

    valid = [c for c in comps if c["accessibility"] is not None]

    def avg(key):
        vals = [c[key] for c in valid if c.get(key) is not None]
        return round(sum(vals) / len(vals)) if vals else None

    average = {k: avg(k) for k in ["accessibility", "wcag", "issues", "critical", "contrast", "altText", "keyboard"]}
    return {
        "base": base_sum,
        "competitors": comps,
        "average": average,
        "category": bench.get("category"),
        "insights": _insights(base_sum, comps, average),
    }
