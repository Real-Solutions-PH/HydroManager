from datetime import date

import httpx

from app.modules.climate.providers.base import ClimateProvider
from app.modules.climate.schema import ClimateNormals

POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"

PARAMS = [
    "T2M",
    "T2M_MIN",
    "T2M_MAX",
    "RH2M",
    "ALLSKY_SFC_SW_DWN",
    "PRECTOTCORR",
]

MONTH_KEYS = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
]


class NasaPowerProvider(ClimateProvider):
    """NASA POWER Climatology — free, no API key. Long-term monthly normals."""

    name = "nasa_power"

    def __init__(self, timeout: float = 20.0):
        self.timeout = timeout

    async def get_monthly_normals(
        self, *, lat: float, lon: float, month: int
    ) -> ClimateNormals:
        params = {
            "parameters": ",".join(PARAMS),
            "community": "AG",
            "longitude": lon,
            "latitude": lat,
            "format": "JSON",
            "start": str(date.today().year - 20),
            "end": str(date.today().year - 1),
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(POWER_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
        params_block = (
            data.get("properties", {}).get("parameter", {}) if data else {}
        )
        key = MONTH_KEYS[month - 1]

        def pick(name: str) -> float | None:
            block = params_block.get(name) or {}
            v = block.get(key)
            if v is None or v == -999 or v == -999.0:
                return None
            try:
                return float(v)
            except (TypeError, ValueError):
                return None

        sw = pick("ALLSKY_SFC_SW_DWN")
        sunlight_hours = sw / 0.45 if sw is not None else None

        return ClimateNormals(
            provider=self.name,
            lat=lat,
            lon=lon,
            month=month,
            air_temp_c_avg=pick("T2M"),
            air_temp_c_min=pick("T2M_MIN"),
            air_temp_c_max=pick("T2M_MAX"),
            humidity_pct_avg=pick("RH2M"),
            sunlight_hours_avg=sunlight_hours,
            precipitation_mm_total=pick("PRECTOTCORR"),
            solar_radiation_mj_m2_day=sw,
        )
