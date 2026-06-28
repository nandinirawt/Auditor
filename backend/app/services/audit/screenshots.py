"""Real screenshot capture using Playwright (headless Chromium).

This is the first slice of the audit engine: given a URL, open it in a real
browser at three device profiles and capture full-page screenshots. Files are
written under ``backend/static/screenshots/<token>/<device>.png`` and served by
the app's static mount.

Playwright is imported lazily so the rest of the API still runs if it has not
been installed yet; the endpoint surfaces a clear "please install" message.
"""
from __future__ import annotations

import uuid
from pathlib import Path

# backend/app/services/audit/screenshots.py -> parents[3] == backend/
BASE_DIR = Path(__file__).resolve().parents[3]
STATIC_DIR = BASE_DIR / "static"
SCREENSHOT_DIR = STATIC_DIR / "screenshots"

# width, height, device_scale_factor, is_mobile
DEVICE_PROFILES = {
    "desktop": {"width": 1440, "height": 900, "dsf": 1, "is_mobile": False},
    "tablet": {"width": 834, "height": 1112, "dsf": 2, "is_mobile": True},
    "mobile": {"width": 390, "height": 844, "dsf": 3, "is_mobile": True},
}

NAV_TIMEOUT_MS = 45000
SETTLE_MS = 900


class CaptureError(Exception):
    """Raised when a capture cannot be completed."""


_AUTOSCROLL = """
async () => {
  await new Promise((resolve) => {
    let total = 0;
    const step = 500;
    const timer = setInterval(() => {
      window.scrollBy(0, step);
      total += step;
      if (total >= document.body.scrollHeight || total > 12000) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 80);
  });
}
"""

# Captures real performance (Navigation/Paint/Resource Timing), SEO signals and
# page structure in a single pass on the already-rendered page.
_MEASURE_JS = """
() => {
  const nav = (performance.getEntriesByType('navigation') || [])[0] || {};
  const paint = performance.getEntriesByType('paint') || [];
  const fcpEntry = paint.find((p) => p.name === 'first-contentful-paint');
  const fcp = fcpEntry ? fcpEntry.startTime : null;
  const res = performance.getEntriesByType('resource') || [];
  const totalBytes = res.reduce((a, r) => a + (r.transferSize || 0), 0) + (nav.transferSize || 0);
  const reqCount = res.length + 1;

  const q = (s) => document.querySelector(s);
  const title = document.title || '';
  const metaDesc = (q('meta[name="description"]') || {}).content || '';
  const robots = (q('meta[name="robots"]') || {}).content || '';
  const lang = document.documentElement.getAttribute('lang') || '';
  const viewport = !!q('meta[name="viewport"]');
  const canonical = !!q('link[rel="canonical"]');
  const jsonld = document.querySelectorAll('script[type="application/ld+json"]').length;
  const h1s = document.querySelectorAll('h1').length;
  const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6').length;

  const imgEls = document.querySelectorAll('img');
  const imagesWithAlt = Array.from(imgEls).filter((i) => i.hasAttribute('alt')).length;

  const origin = location.origin;
  const bad = ['click here', 'here', 'read more', 'more', 'link', 'this'];
  let internalLinks = 0, externalLinks = 0, badLinkText = 0;
  document.querySelectorAll('a[href]').forEach((a) => {
    try {
      const u = new URL(a.href, location.href);
      if (u.protocol.startsWith('http')) {
        if (u.origin === origin) internalLinks++; else externalLinks++;
      }
      const t = (a.textContent || '').trim().toLowerCase();
      if (t && bad.includes(t)) badLinkText++;
    } catch (e) {}
  });

  return {
    fcp,
    nav: { load: nav.loadEventEnd || null, dcl: nav.domContentLoadedEventEnd || null, transferSize: nav.transferSize || 0 },
    totalBytes,
    reqCount,
    seo: { title, titleLen: title.length, metaDesc, metaDescLen: metaDesc.length, robots, lang, viewport, canonical, jsonld, h1s, headings },
    struct: {
      images: imgEls.length, imagesWithAlt,
      internalLinks, externalLinks, badLinkText,
      buttons: document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input, select, textarea').length,
      domCount: document.querySelectorAll('*').length,
    },
  };
}
"""


async def capture_screenshots(url: str, crawl: bool = True) -> dict:
    """Capture full-page screenshots of ``url`` at every device profile.

    Returns a dict with ``url``, ``final_url``, ``title``, ``token`` and a list
    of ``shots`` (device, rel_path, width, file_size). Raises ``CaptureError``.
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:  # pragma: no cover - depends on host install
        raise CaptureError("playwright_not_installed") from exc

    from app.services.audit.accessibility import map_results, run_axe

    token = uuid.uuid4().hex[:12]
    out_dir = SCREENSHOT_DIR / token
    out_dir.mkdir(parents=True, exist_ok=True)

    MAX_CRAWL_PAGES = 4
    shots: list[dict] = []
    title: str | None = None
    final_url = url
    axe_raw = None
    perf_raw = None
    hrefs = None
    pages: list[dict] = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
            try:
                for device, cfg in DEVICE_PROFILES.items():
                    context = await browser.new_context(
                        viewport={"width": cfg["width"], "height": cfg["height"]},
                        device_scale_factor=cfg["dsf"],
                        is_mobile=cfg["is_mobile"],
                    )
                    page = await context.new_page()
                    try:
                        await page.goto(url, wait_until="load", timeout=NAV_TIMEOUT_MS)
                    except Exception as exc:
                        await context.close()
                        raise CaptureError(f"navigation_failed: {exc}") from exc

                    # Let late resources settle and trigger lazy-loaded media.
                    try:
                        await page.wait_for_load_state("networkidle", timeout=8000)
                    except Exception:
                        pass
                    try:
                        await page.evaluate(_AUTOSCROLL)
                    except Exception:
                        pass
                    await page.wait_for_timeout(SETTLE_MS)

                    if title is None:
                        try:
                            title = await page.title()
                        except Exception:
                            title = None
                        final_url = page.url

                    fname = f"{device}.png"
                    fpath = out_dir / fname
                    await page.screenshot(path=str(fpath), full_page=True)
                    shots.append(
                        {
                            "device": device,
                            "rel_path": f"screenshots/{token}/{fname}",
                            "width": cfg["width"],
                            "file_size": fpath.stat().st_size if fpath.exists() else None,
                        }
                    )

                    # Real accessibility scan on the homepage (desktop view).
                    if device == "desktop" and axe_raw is None:
                        try:
                            axe_raw = await run_axe(page)
                        except Exception:
                            axe_raw = None
                        try:
                            hrefs = await page.evaluate(
                                "() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href)"
                            )
                        except Exception:
                            hrefs = []
                        try:
                            perf_raw = await page.evaluate(_MEASURE_JS)
                        except Exception:
                            perf_raw = None

                    await context.close()

                # Crawl a few public pages (products, about, login if public, …).
                if crawl and hrefs:
                    from app.services.audit.crawler import crawl_pages, pick_crawl_targets
                    targets = pick_crawl_targets(hrefs, final_url, max_pages=MAX_CRAWL_PAGES)
                    if targets:
                        try:
                            pages = await crawl_pages(browser, targets, out_dir, token)
                        except Exception:
                            pages = []
            finally:
                await browser.close()
    except CaptureError:
        raise
    except Exception as exc:  # pragma: no cover - runtime/browser failures
        raise CaptureError(f"capture_failed: {exc}") from exc

    if not shots:
        raise CaptureError("no_screenshots_produced")

    accessibility = None
    if axe_raw is not None:
        try:
            accessibility = map_results(axe_raw, page_path="/")
        except Exception:
            accessibility = None

    # Real performance / SEO / UX / structure from the on-page measurement.
    metrics = {}
    if perf_raw is not None:
        try:
            from app.services.audit.metrics import build_metrics
            metrics = build_metrics(perf_raw, accessibility, final_url)
        except Exception:
            metrics = {}

    overall = metrics.get("overall")
    if overall is None and accessibility is not None:
        overall = accessibility.get("overall")

    return {
        "url": url,
        "final_url": final_url,
        "title": title or final_url,
        "token": token,
        "shots": shots,
        "accessibility": accessibility,
        "pages": pages,
        "performance": metrics.get("performance"),
        "seo": metrics.get("seo"),
        "ux": metrics.get("ux"),
        "structure": metrics.get("structure"),
        "overall": overall,
    }
