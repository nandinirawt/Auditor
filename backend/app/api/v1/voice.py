"""Audio narration endpoint — 'Listen to this audit'."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.services.audit import store
from app.services.audit.screenshots import STATIC_DIR
from app.services.audit.voice import VoiceError, build_summary_text, synthesize

router = APIRouter(tags=["voice"])

AUDIO_DIR = STATIC_DIR / "audio"


@router.post("/audit/{token}/narration", summary="Generate (or reuse) an audio summary of the audit")
async def narrate(token: str, request: Request, force: bool = False):
    audit = store.load_audit(token)
    if audit is None:
        raise HTTPException(status_code=404, detail="audit_not_found")

    text = build_summary_text(audit)
    fname = f"{token}_summary.wav"
    fpath = AUDIO_DIR / fname
    cached = fpath.exists() and not force

    if not cached:
        try:
            await synthesize(text, fpath)
        except VoiceError as exc:
            msg = str(exc)
            if "no_api_key" in msg:
                # Not an error the user caused — audio just isn't configured yet.
                raise HTTPException(status_code=503, detail="smallest_api_key_missing")
            raise HTTPException(status_code=502, detail=f"tts_failed: {msg}")

    base = str(request.base_url).rstrip("/")
    return {"audio_url": f"{base}/static/audio/{fname}", "text": text, "cached": cached}
