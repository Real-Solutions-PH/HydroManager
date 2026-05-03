import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class Milestone(str, Enum):
    Sowed = "Sowed"
    Germinated = "Germinated"
    SeedLeaves = "SeedLeaves"
    TrueLeaves = "TrueLeaves"
    Transplanted = "Transplanted"
    Vegetative = "Vegetative"
    Flowering = "Flowering"
    FruitSet = "FruitSet"
    HarvestReady = "HarvestReady"
    Harvested = "Harvested"
    Failed = "Failed"


class BatchBase(SQLModel):
    setup_id: uuid.UUID
    crop_guide_id: uuid.UUID | None = None
    variety_name: str = Field(min_length=1, max_length=120)
    initial_count: int = Field(ge=1)
    slots_used: int | None = Field(default=None, ge=1, le=2000)
    seeds_per_slot: int | None = Field(default=None, ge=1, le=100)
    notes: str | None = Field(default=None, max_length=1000)


class BatchCreate(SQLModel):
    setup_id: uuid.UUID
    crop_guide_id: uuid.UUID | None = None
    variety_name: str = Field(min_length=1, max_length=120)
    slots_used: int = Field(ge=1, le=2000)
    seeds_per_slot: int = Field(ge=1, le=100)
    notes: str | None = Field(default=None, max_length=1000)
    started_at: datetime | None = None


class BatchUpdate(SQLModel):
    setup_id: uuid.UUID | None = None
    variety_name: str | None = Field(default=None, min_length=1, max_length=120)
    crop_guide_id: uuid.UUID | None = None
    notes: str | None = Field(default=None, max_length=1000)
    started_at: datetime | None = None
    archived_at: datetime | None = None


class BatchStateCountPublic(SQLModel):
    milestone_code: Milestone
    count: int
    updated_at: datetime


class BatchTransitionCreate(SQLModel):
    from_milestone: Milestone
    to_milestone: Milestone
    count: int = Field(ge=1)
    notes: str | None = Field(default=None, max_length=500)
    photo_url: str | None = Field(default=None, max_length=500)
    occurred_at: datetime | None = None


class BatchTransitionPublic(SQLModel):
    id: uuid.UUID
    from_milestone: Milestone
    to_milestone: Milestone
    count: int
    occurred_at: datetime
    notes: str | None = None
    photo_url: str | None = None


class BatchHarvestCreate(SQLModel):
    weight_grams: float = Field(gt=0)
    count: int = Field(ge=1)
    notes: str | None = Field(default=None, max_length=500)
    harvested_at: datetime | None = None


class BatchAllocateSlots(SQLModel):
    slots_used: int = Field(ge=1, le=2000)
    seeds_per_slot: int = Field(ge=1, le=100)


class BatchHarvestPublic(SQLModel):
    id: uuid.UUID
    weight_grams: float
    count: int
    harvested_at: datetime
    notes: str | None = None


class BatchPublic(BatchBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    started_at: datetime
    archived_at: datetime | None = None
    legacy: bool = False


class BatchDetail(BatchPublic):
    state_counts: list[BatchStateCountPublic] = []
    recent_transitions: list[BatchTransitionPublic] = []


class BatchesPublic(SQLModel):
    data: list[BatchPublic]
    count: int
