import time
from typing import Any

from app.modules.climate.providers import get_provider
from app.modules.climate.schema import ClimateNormals

_CACHE: dict[tuple[str, float, float, int], tuple[float, ClimateNormals]] = {}
_TTL_SECONDS = 60 * 60 * 24


def _cache_key(provider: str, lat: float, lon: float, month: int) -> tuple[str, float, float, int]:
    return (provider, round(lat, 2), round(lon, 2), month)


async def fetch_normals(
    *,
    lat: float,
    lon: float,
    month: int,
    provider: str | None = None,
) -> ClimateNormals:
    p = get_provider(provider)
    key = _cache_key(p.name, lat, lon, month)
    now = time.time()
    cached = _CACHE.get(key)
    if cached and (now - cached[0]) < _TTL_SECONDS:
        return cached[1]
    result = await p.get_monthly_normals(lat=lat, lon=lon, month=month)
    _CACHE[key] = (now, result)
    return result


def cache_stats() -> dict[str, Any]:
    return {"size": len(_CACHE), "ttl_seconds": _TTL_SECONDS}
