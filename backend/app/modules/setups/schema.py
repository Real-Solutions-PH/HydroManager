import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class SetupType(str, Enum):
    DFT = "DFT"
    NFT = "NFT"
    DutchBucket = "DutchBucket"
    Kratky = "Kratky"
    SNAP = "SNAP"


class SlotStatus(str, Enum):
    EMPTY = "empty"
    PLANTED = "planted"
    GROWING = "growing"
    READY = "ready"


class SetupBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    type: SetupType
    slot_count: int = Field(ge=1, le=2000)
    location_label: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)
    installed_at: datetime | None = None


class SetupCreate(SetupBase):
    pass


class SetupUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    type: SetupType | None = None
    slot_count: int | None = Field(default=None, ge=1, le=2000)
    location_label: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)
    installed_at: datetime | None = None
    archived_at: datetime | None = None


class SetupSlotPublic(SQLModel):
    id: uuid.UUID
    slot_code: str
    position_index: int
    status: SlotStatus
    batch_id: uuid.UUID | None = None


class SetupPhotoPublic(SQLModel):
    id: uuid.UUID
    storage_url: str
    uploaded_at: datetime


class SetupPublic(SetupBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    archived_at: datetime | None = None


class SetupDetail(SetupPublic):
    slots: list[SetupSlotPublic] = []
    photos: list[SetupPhotoPublic] = []


class SetupsPublic(SQLModel):
    data: list[SetupPublic]
    count: int


class SetupPhotoCreate(SQLModel):
    storage_url: str = Field(min_length=1, max_length=500)
