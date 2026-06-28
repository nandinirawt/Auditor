"""Performance, SEO and UX scoring from real on-page measurement.

None of this needs Lighthouse. Everything here is computed from signals captured
on the page we already render during the audit:

- Performance: real Navigation Timing + Paint Timing + Resource Timing (FCP, load
  time, bytes transferred, request count). Honest caveat: this is a single run on
  the audit machine's network, not Lighthouse's throttled lab, so it is real but
  rougher than a lab score.
- SEO: real on-page checks (title, meta description, one H1, headings, lang,
  viewport, canonical, alt coverage, link text, noindex, HTTPS) — the same kind of
  DOM checks Lighthouse's SEO category runs.
- UX: a transparent composite of the real signals above (accessibility + speed +
  mobile-friendliness + structure). The weighting is ours, stated openly.
"""
from __future__ import annotations


def _curve(val, good, bad):
    """100 at/below `good`, 0 at/above `bad`, linear in between."""
    if val is None:
        return None
    if val <= good:
        return 100
    if val >= bad:
        return 0
    return round(100 * (bad - val) / (bad - good))


def score_performance(perf: dict) -> dict:
    nav = perf.get("nav") or {}
    fcp = perf.get("fcp")
    load = nav.get("load")
    total_bytes = perf.get("totalBytes") or 0
    requests = perf.get("reqCount") or 0

    fcp_s = _curve(fcp, 1000, 4000)        # First Contentful Paint (ms)
    load_s = _curve(load, 2000, 7000)      # load event (ms)
    bytes_s = _curve(total_bytes, 1_000_000, 6_000_000)
    req_s = _curve(requests, 40, 180)

    parts = [(fcp_s, 0.4), (load_s, 0.3), (bytes_s, 0.2), (req_s, 0.1)]
    parts = [(s, w) for s, w in parts if s is not None]
    score = round(sum(s * w for s, w in parts) / sum(w for _, w in parts)) if parts else None

    return {
        "score": score,
        "fcp": round(fcp) if fcp else None,
        "load": round(load) if load else None,
        "bytes": total_bytes,
        "requests": requests,
        "metrics": [
            {"label": "First Contentful Paint", "value": f"{round(fcp)} ms" if fcp else "—", "score": fcp_s},
            {"label": "Page load", "value": f"{round(load)} ms" if load else "—", "score": load_s},
            {"label": "Transferred", "value": f"{round(total_bytes / 1024)} KB" if total_bytes else "—", "score": bytes_s},
            {"label": "Requests", "value": str(requests) if requests else "—", "score": req_s},
        ],
    }


def score_seo(seo: dict, struct: dict, final_url: str) -> dict:
    checks = []

    def add(label, ok, weight=1):
        checks.append({"label": label, "pass": bool(ok), "weight": weight})

    title = seo.get("title", "") or ""
    tl = seo.get("titleLen", 0) or 0
    dl = seo.get("metaDescLen", 0) or 0
    imgs = struct.get("images", 0) or 0
    with_alt = struct.get("imagesWithAlt", 0) or 0
    alt_cov = (with_alt / imgs) if imgs else 1.0

    add("Page title present", bool(title), 2)
    add("Title length 10–70 chars", 10 <= tl <= 70)
    add("Meta description present", bool(seo.get("metaDesc")), 2)
    add("Meta description 50–160 chars", 50 <= dl <= 160)
    add("Exactly one H1", seo.get("h1s") == 1)
    add("Has heading structure", (seo.get("headings") or 0) >= 2)
    add("Language declared", bool(seo.get("lang")))
    add("Mobile viewport set", bool(seo.get("viewport")), 2)
    add("Images have alt text (≥90%)", alt_cov >= 0.9)
    add("Descriptive link text", (struct.get("badLinkText", 0) or 0) == 0)
    add("Not blocked by noindex", "noindex" not in (seo.get("robots", "") or "").lower(), 2)
    add("Served over HTTPS", str(final_url).startswith("https"), 2)
    add("Structured data present", (seo.get("jsonld", 0) or 0) > 0)

    total = sum(c["weight"] for c in checks)
    passed = sum(c["weight"] for c in checks if c["pass"])
    score = round(100 * passed / total) if total else None
    return {
        "score": score,
        "checks": checks,
        "passed": sum(1 for c in checks if c["pass"]),
        "total": len(checks),
    }


def score_ux(accessibility: dict, performance: dict, seo: dict, struct: dict) -> dict:
    acc = (accessibility or {}).get("score")
    perf = (performance or {}).get("score")
    seo_s = (seo or {}).get("score")
    mobile = 100 if struct.get("viewport") else 35

    parts = [(acc, 0.40), (mobile, 0.20), (perf, 0.20), (seo_s, 0.20)]
    parts = [(s, w) for s, w in parts if s is not None]
    score = round(sum(s * w for s, w in parts) / sum(w for _, w in parts)) if parts else None
    return {
        "score": score,
        "factors": [
            {"label": "Accessibility", "score": acc},
            {"label": "Mobile friendly", "score": mobile},
            {"label": "Speed", "score": perf},
            {"label": "Structure / SEO", "score": seo_s},
        ],
    }


def compute_overall(accessibility, performance, seo, ux) -> int | None:
    """True weighted blend of every real component (competitor excluded — it's
    optional, only 5%, and not known at audit time)."""
    parts = []
    if accessibility and accessibility.get("score") is not None:
        parts.append((accessibility["score"], 25))
    if performance and performance.get("score") is not None:
        parts.append((performance["score"], 20))
    if seo and seo.get("score") is not None:
        parts.append((seo["score"], 15))
    if ux and ux.get("score") is not None:
        parts.append((ux["score"], 20))
    wcag_c = (accessibility.get("wcag") or {}).get("compliance") if accessibility else None
    if wcag_c is not None:
        parts.append((wcag_c, 15))
    if not parts:
        return None
    return round(sum(s * w for s, w in parts) / sum(w for _, w in parts))


def build_metrics(perf_raw: dict, accessibility: dict | None, final_url: str) -> dict:
    """Turn raw on-page measurements into performance/seo/ux/structure + overall."""
    perf_raw = perf_raw or {}
    raw_struct = perf_raw.get("struct") or {}
    structure = {
        "internalLinks": raw_struct.get("internalLinks", 0),
        "externalLinks": raw_struct.get("externalLinks", 0),
        "images": raw_struct.get("images", 0),
        "imagesWithAlt": raw_struct.get("imagesWithAlt", 0),
        "buttons": raw_struct.get("buttons", 0),
        "forms": raw_struct.get("forms", 0),
        "inputs": raw_struct.get("inputs", 0),
        "domElements": raw_struct.get("domCount", 0),
        "badLinkText": raw_struct.get("badLinkText", 0),
        "viewport": (perf_raw.get("seo") or {}).get("viewport", False),
    }
    performance = score_performance(perf_raw)
    seo = score_seo(perf_raw.get("seo") or {}, structure, final_url)
    ux = score_ux(accessibility, performance, seo, structure)
    overall = compute_overall(accessibility, performance, seo, ux)
    return {"performance": performance, "seo": seo, "ux": ux, "structure": structure, "overall": overall}
