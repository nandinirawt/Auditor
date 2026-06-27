"""Shared async Redis client (denylist, caching, pub/sub progress)."""
from functools import lru_cache

import redis.asyncio as aioredis

from app.core.config import settings


@lru_cache
def get_redis() -> "aioredis.Redis":
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)
