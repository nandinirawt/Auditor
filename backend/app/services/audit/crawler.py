"""Lightweight multi-page crawler.

From the homepage's links, pick a handful of PUBLIC, reachable pages (products,
about, pricing, contact, a public login if present, etc.), then screenshot and
quick-scan each. It cannot reach pages that require being logged in or having
items in a cart — those are unreachable to any crawler — so it focuses on public
pages and skips anything it can't load.
"""
from __future__ import annotations

from urllib.parse import urlparse, urlunparse

# Paths containing these hints are prioritized (in this order).
_PRIORITY = [
    "login", "sign-in", "signin", "log-in", "account", "register", "sign-up", "signup",
    "cart", "checkout", "basket", "bag",
    "product", "products", "shop", "store", "collection", "category",
    "pricing", "plans", "price",
    "about", "about-us", "company",
    "contact", "support", "help",
    "services", "solutions", "features", "blog", "news", "faq",
]

_SKIP_EXT = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico", ".webp", ".css", ".js",
    ".zip", ".rar", ".gz", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".xml", ".json",
    ".csv", ".doc", ".docx", ".xls", ".xlsx",
)

_AUTOSCROLL = """
async () => { await new Promise((res) => { let t=0; const s=600;
  const id=setInterval(()=>{ window.scrollBy(0,s); t+=s;
    if (t>=document.body.scrollHeight || t>10000){clearInterval(id); window.scrollTo(0,0); res();} },60); }); }
"""


def pick_crawl_targets(hrefs, base_url: str, max_pages: int = 4) -> list[str]:
    """From raw anchor hrefs, choose up to max_pages same-origin public URLs."""
    base = urlparse(base_url)
    base_host = (base.hostname or "").replace("www.", "")
    base_path = (base.path or "/").rstrip("/") or "/"

    seen: set[str] = set()
    scored: list[tuple[int, int, str]] = []  # (priority_rank, order, url)

    for order, raw in enumerate(hrefs or []):
        if not raw or not isinstance(raw, str):
            continue
        try:
            u = urlparse(raw)
        except Exception:
            continue
        if u.scheme not in ("http", "https"):
            continue
        host = (u.hostname or "").replace("www.", "")
        if host != base_host:
            continue  # same-origin only
        path = (u.path or "/").rstrip("/") or "/"
        if path == base_path or path == "/":
            continue  # skip the homepage itself
        if any(path.lower().endswith(ext) for ext in _SKIP_EXT):
            continue
        clean = urlunparse((u.scheme, u.netloc, u.path, "", "", ""))
        if clean in seen:
            continue
        seen.add(clean)

        low = path.lower()
        rank = next((i for i, kw in enumerate(_PRIORITY) if kw in low), len(_PRIORITY))
        scored.append((rank, order, clean))

    scored.sort(key=lambda t: (t[0], t[1]))
    return [url for _, _, url in scored[:max_pages]]


async def crawl_pages(browser, targets: list[str], out_dir, token: str) -> list[dict]:
    """Screenshot + quick accessibility score for each target. Best-effort."""
    from app.services.audit.accessibility import map_results, run_axe

    pages: list[dict] = []
    for i, turl in enumerate(targets):
        try:
            ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
            page = await ctx.new_page()
            try:
                try:
                    await page.goto(turl, wait_until="load", timeout=25000)
                except Exception:
                    await ctx.close()
                    continue
                try:
                    await page.wait_for_load_state("networkidle", timeout=6000)
                except Exception:
                    pass
                try:
                    await page.evaluate(_AUTOSCROLL)
                except Exception:
                    pass
                await page.wait_for_timeout(400)

                try:
                    ptitle = await page.title()
                except Exception:
                    ptitle = turl

                fname = f"page_{i + 1}.png"
                try:
                    await page.screenshot(path=str(out_dir / fname), full_page=True)
                except Exception:
                    await ctx.close()
                    continue

                score = issues = None
                try:
                    mapped = map_results(await run_axe(page))
                    score = mapped["score"]
                    issues = mapped["stats"]["violations"]
                except Exception:
                    pass

                path = urlparse(turl).path or "/"
                pages.append({
                    "url": turl,
                    "path": path,
                    "title": ptitle,
                    "rel_path": f"screenshots/{token}/{fname}",
                    "accessibility_score": score,
                    "issues": issues,
                })
                await ctx.close()
            except Exception:
                try:
                    await ctx.close()
                except Exception:
                    pass
                continue
        except Exception:
            continue
    return pages
