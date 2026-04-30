from sqlmodel import SQLModel


class CropStatValue(SQLModel):
    min: float
    max: float
    avg: float


class CropStatsResponse(SQLModel):
    stats: dict[str, CropStatValue]


class CropStatsRecomputeResponse(SQLModel):
    updated_fields: int
