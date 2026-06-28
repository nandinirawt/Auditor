"""Audio narration via smallest.ai Text-to-Speech.

Builds a short, spoken-friendly summary of an audit from its real findings, then
synthesises it to a WAV using smallest.ai's Lightning TTS endpoint. The API key is
optional: if it is absent, callers get a clear "not configured" signal and audio is
simply unavailable rather than the app breaking.
"""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings


class VoiceError(Exception):
    pass


def _join(items: list[str]) -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " and " + items[-1]


def _grade(score: int | None) -> str | None:
    if score is None:
        return None
    if score >= 90:
        return "A, excellent"
    if score >= 75:
        return "B, good"
    if score >= 50:
        return "C, needs work"
    return "D, poor"


def build_summary_text(audit: dict) -> str:
    """A natural-language summary suitable for reading aloud. Spelled-out acronyms
    (W C A G, U X, double A) so the voice pronounces them as letters."""
    acc = audit.get("accessibility") or {}
    snap = acc.get("snapshot") or {}
    counts = acc.get("counts") or {}
    wcag = acc.get("wcag") or {}
    domain = audit.get("domain") or "this site"
    overall = audit.get("overall")
    if overall is None:
        overall = acc.get("overall")
    score = acc.get("score")

    parts: list[str] = []

    intro = f"Accessibility and U X audit for {domain}."
    if overall is not None:
        g = _grade(overall)
        intro += f" The overall score is {overall} out of 100"
        intro += f", a grade of {g}." if g else "."
    parts.append(intro)

    strengths: list[str] = []
    if score is not None and score >= 90:
        strengths.append("strong overall accessibility")
    if (snap.get("altText") or 0) == 0:
        strengths.append("all images have text alternatives")
    if (snap.get("contrast") or 0) == 0:
        strengths.append("text contrast meets the double A standard")
    if (snap.get("keyboard") or 0) == 0:
        strengths.append("interactive elements appear keyboard reachable")
    if strengths:
        parts.append("On the positive side, " + _join(strengths) + ".")

    weak: list[str] = []
    crit = counts.get("critical") or 0
    if crit:
        weak.append(f"{crit} critical issue{'s' if crit != 1 else ''} blocking some users")
    if snap.get("contrast"):
        n = snap["contrast"]
        weak.append(f"{n} colour contrast problem{'s' if n != 1 else ''}")
    if snap.get("altText"):
        n = snap["altText"]
        weak.append(f"{n} image{'s' if n != 1 else ''} missing alt text")
    if snap.get("keyboard"):
        n = snap["keyboard"]
        weak.append(f"{n} keyboard or focus issue{'s' if n != 1 else ''}")
    if weak:
        parts.append("Areas to improve include " + _join(weak) + ".")
    else:
        parts.append("No major accessibility violations were found on the homepage.")

    findings = acc.get("findings") or []
    top = (
        next((f for f in findings if f.get("severity") == "critical"), None)
        or next((f for f in findings if f.get("severity") == "serious"), None)
        or (findings[0] if findings else None)
    )
    if top and top.get("title"):
        parts.append(f"The most critical issue is: {top['title']}.")

    comp = wcag.get("compliance")
    if comp is not None:
        parts.append(f"W C A G compliance is {comp} percent.")

    parts.append("Full details are on screen.")
    return " ".join(parts)


async def synthesize(text: str, out_path: Path) -> int:
    """Call smallest.ai TTS and write the returned WAV to out_path. Returns byte size."""
    if not settings.SMALLEST_API_KEY:
        raise VoiceError("no_api_key")

    try:
        import httpx
    except ImportError as exc:  # pragma: no cover
        raise VoiceError("httpx_not_installed") from exc

    payload = {
        "text": text,
        "voice_id": settings.SMALLEST_VOICE_ID,
        "sample_rate": settings.SMALLEST_SAMPLE_RATE,
        "output_format": "wav",
    }
    headers = {
        "Authorization": f"Bearer {settings.SMALLEST_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(settings.SMALLEST_TTS_URL, json=payload, headers=headers)
    except Exception as exc:  # network / timeout
        raise VoiceError(f"request_failed: {exc}") from exc

    if resp.status_code != 200:
        snippet = resp.text[:200] if resp.text else ""
        raise VoiceError(f"api_error_{resp.status_code}: {snippet}")

    data = resp.content
    if not data:
        raise VoiceError("empty_audio")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(data)
    return len(data)
