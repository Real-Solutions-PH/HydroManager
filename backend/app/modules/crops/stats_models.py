from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class CropStat(SQLModel, table=True):
    __tablename__ = "crop_stat"

    field: str = Field(primary_key=True, max_length=40)
    min_value: float
    max_value: float
    avg_value: float
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
