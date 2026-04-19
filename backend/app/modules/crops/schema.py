import uuid
from enum import Enum

from sqlmodel import Field, SQLModel


class CropCategory(str, Enum):
    leafy = "leafy"
    herb = "herb"
    fruiting = "fruiting"
    other = "other"


class CropGuideBase(SQLModel):
    name_en: str = Field(min_length=1, max_length=80)
    name_tl: str = Field(min_length=1, max_length=80)
    category: CropCategory
    recommended_setups: str = Field(max_length=200)
    ph_min: float
    ph_max: float
    ec_min: float
    ec_max: float
    days_to_harvest_min: int
    days_to_harvest_max: int
    typical_yield_grams: float | None = None
    sunlight_hours: str | None = Field(default=None, max_length=40)
    temperature_day_c: str | None = Field(default=None, max_length=40)
    temperature_night_c: str | None = Field(default=None, max_length=40)
    common_issues: str | None = Field(default=None, max_length=1000)
    harvest_indicator: str | None = Field(default=None, max_length=300)
    image_key: str | None = Field(default=None, max_length=80)
    source: str | None = Field(default=None, max_length=200)


class CropGuidePublic(CropGuideBase):
    id: uuid.UUID


class CropGuidesPublic(SQLModel):
    data: list[CropGuidePublic]
    count: int
