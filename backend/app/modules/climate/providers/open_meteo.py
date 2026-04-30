from datetime import date, timedelta

import httpx

from app.modules.climate.providers.base import ClimateProvider
from app.modules.climate.schema import ClimateNormals

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


def _month_window(month: int, years_back: int = 5) -> tuple[date, date]:
    today = date.today()
    end_year = today.year - 1
    start_year = end_year - years_back + 1
    start = date(start_year, month, 1)
    next_month_year = end_year + (1 if month == 12 else 0)
    next_month = 1 if month == 12 else month + 1
    end = date(next_month_year, next_month, 1) - timedelta(days=1)
    return start, end


def _avg(xs: list[float | None]) -> float | None:
    vals = [x for x in xs if x is not None]
    return sum(vals) / len(vals) if vals else None


def _sum(xs: list[float | None]) -> float | None:
    vals = [x for x in xs if x is not None]
    return sum(vals) if vals else None


class OpenMeteoProvider(ClimateProvider):
    """Open-Meteo Historical archive — free, no API key.

    Aggregates last N years of daily values for the requested month
    into monthly normals.
    """

    name = "open_meteo"

    def __init__(self, years_back: int = 5, timeout: float = 15.0):
        self.years_back = years_back
        self.timeout = timeout

    async def get_monthly_normals(
        self, *, lat: float, lon: float, month: int
    ) -> ClimateNormals:
        start, end = _month_window(month, self.years_back)
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": ",".join(
                [
                    "temperature_2m_mean",
                    "temperature_2m_min",
                    "temperature_2m_max",
                    "relative_humidity_2m_mean",
                    "sunshine_duration",
                    "precipitation_sum",
                    "shortwave_radiation_sum",
                ]
            ),
            "timezone": "UTC",
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(ARCHIVE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        d = data.get("daily", {}) or {}
        sunshine_seconds = d.get("sunshine_duration") or []
        sunlight_hours_daily = [
            (s / 3600.0) if s is not None else None for s in sunshine_seconds
        ]
        return ClimateNormals(
            provider=self.name,
            lat=lat,
            lon=lon,
            month=month,
            air_temp_c_avg=_avg(d.get("temperature_2m_mean") or []),
            air_temp_c_min=_avg(d.get("temperature_2m_min") or []),
            air_temp_c_max=_avg(d.get("temperature_2m_max") or []),
            humidity_pct_avg=_avg(d.get("relative_humidity_2m_mean") or []),
            sunlight_hours_avg=_avg(sunlight_hours_daily),
            precipitation_mm_total=_sum(d.get("precipitation_sum") or []),
            solar_radiation_mj_m2_day=_avg(d.get("shortwave_radiation_sum") or []),
        )
