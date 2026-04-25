import uuid
from datetime import date, datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class ProduceStatus(str, Enum):
    ready = "ready"
    reserved = "reserved"
    sold = "sold"


class ProduceMovementType(str, Enum):
    harvest = "harvest"
    reserve = "reserve"
    sell = "sell"
    discard = "discard"
    adjust = "adjust"


class ExpiryStatus(str, Enum):
    ok = "ok"
    warning = "warning"
    expired = "expired"


class ProduceBase(SQLModel):
    name: str = Field(min_length=1, max_length=120)
    quantity: float = Field(ge=0, default=0)
    unit: str = Field(min_length=1, max_length=24, default="kg")
    harvested_at: date
    expiry_date: date | None = None
    selling_price: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class ProduceCreate(ProduceBase):
    source_batch_id: uuid.UUID | None = None


class ProduceUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    quantity: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=24)
    status: ProduceStatus | None = None
    expiry_date: date | None = None
    selling_price: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class ProducePublic(ProduceBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    source_batch_id: uuid.UUID | None = None
    status: ProduceStatus = ProduceStatus.ready
    expiry_status: ExpiryStatus = ExpiryStatus.ok
    days_until_expiry: int | None = None
    created_at: datetime


class ProducesPublic(SQLModel):
    data: list[ProducePublic]
    count: int


class ProduceMovementCreate(SQLModel):
    movement_type: ProduceMovementType
    quantity: float = Field(gt=0)
    notes: str | None = Field(default=None, max_length=500)


class ProduceMovementPublic(SQLModel):
    id: uuid.UUID
    produce_id: uuid.UUID
    movement_type: ProduceMovementType
    quantity: float
    related_sale_id: uuid.UUID | None = None
    occurred_at: datetime
    notes: str | None = None


class ProduceMovementsPublic(SQLModel):
    data: list[ProduceMovementPublic]
    count: int
