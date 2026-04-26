from pydantic import BaseModel, Field


class ClimateNormals(BaseModel):
    """Monthly climate normals for a (lat, lon, month) point."""

    provider: str
    lat: float
    lon: float
    month: int = Field(ge=1, le=12)
    air_temp_c_avg: float | None = None
    air_temp_c_min: float | None = None
    air_temp_c_max: float | None = None
    humidity_pct_avg: float | None = None
    sunlight_hours_avg: float | None = None
    precipitation_mm_total: float | None = None
    solar_radiation_mj_m2_day: float | None = None
