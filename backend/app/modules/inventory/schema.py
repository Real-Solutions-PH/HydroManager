import uuid
from datetime import date, datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class InventoryCategory(str, Enum):
    seeds = "seeds"
    media = "media"
    nutrients = "nutrients"
    equipment = "equipment"
    packaging = "packaging"
    other = "other"


class InventoryUnit(str, Enum):
    grams = "grams"
    pieces = "pieces"
    liters = "liters"
    milliliters = "milliliters"


class MovementType(str, Enum):
    restock = "restock"
    consume = "consume"
    adjust = "adjust"


class ExpiryStatus(str, Enum):
    ok = "ok"
    warning = "warning"
    expired = "expired"


class InventoryItemBase(SQLModel):
    name: str = Field(min_length=1, max_length=120)
    category: InventoryCategory
    unit: InventoryUnit
    current_stock: float = Field(ge=0, default=0)
    low_stock_threshold: float = Field(ge=0, default=0)
    unit_cost: float | None = Field(default=None, ge=0)
    expiry_date: date | None = None
    notes: str | None = Field(default=None, max_length=500)


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    category: InventoryCategory | None = None
    unit: InventoryUnit | None = None
    low_stock_threshold: float | None = Field(default=None, ge=0)
    unit_cost: float | None = Field(default=None, ge=0)
    expiry_date: date | None = None
    notes: str | None = Field(default=None, max_length=500)


class InventoryItemPublic(InventoryItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    is_low_stock: bool = False
    expiry_status: ExpiryStatus = ExpiryStatus.ok
    days_until_expiry: int | None = None
    last_restocked_at: datetime | None = None


class InventoryItemsPublic(SQLModel):
    data: list[InventoryItemPublic]
    count: int


class MovementCreate(SQLModel):
    movement_type: MovementType
    quantity: float = Field(ge=0)
    cost_total: float | None = Field(default=None, ge=0)
    related_batch_id: uuid.UUID | None = None
    notes: str | None = Field(default=None, max_length=500)
    occurred_at: datetime | None = None


class MovementPublic(SQLModel):
    id: uuid.UUID
    item_id: uuid.UUID
    movement_type: MovementType
    quantity: float
    cost_total: float | None = None
    related_batch_id: uuid.UUID | None = None
    occurred_at: datetime
    notes: str | None = None
