"""URL helpers."""
from urllib.parse import urlparse


def extract_domain(url: str) -> str | None:
    try:
        netloc = urlparse(str(url)).netloc
        return netloc.split("@")[-1].split(":")[0].lower() or None
    except Exception:
        return None
