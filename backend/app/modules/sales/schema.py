import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class PaymentStatus(str, Enum):
    paid = "paid"
    pending = "pending"
    cancelled = "cancelled"


class SaleChannel(str, Enum):
    direct = "direct"
    market = "market"
    delivery = "delivery"
    resto = "resto"
    other = "other"


class SaleItemInput(SQLModel):
    crop_name: str = Field(min_length=1, max_length=120)
    quantity: float = Field(gt=0)
    unit: str = Field(default="g", max_length=20)
    unit_price: float = Field(ge=0)
    linked_batch_id: uuid.UUID | None = None


class SaleCreate(SQLModel):
    buyer_label: str | None = Field(default=None, max_length=120)
    channel: SaleChannel = SaleChannel.direct
    sold_at: datetime | None = None
    payment_status: PaymentStatus = PaymentStatus.paid
    notes: str | None = Field(default=None, max_length=500)
    items: list[SaleItemInput]


class SaleItemPublic(SQLModel):
    id: uuid.UUID
    crop_name: str
    quantity: float
    unit: str
    unit_price: float
    linked_batch_id: uuid.UUID | None = None


class SalePublic(SQLModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    buyer_label: str | None = None
    channel: SaleChannel
    sold_at: datetime
    payment_status: PaymentStatus
    notes: str | None = None


class SaleDetail(SalePublic):
    items: list[SaleItemPublic] = []


class SalesPublic(SQLModel):
    data: list[SaleDetail]
    count: int


class OverheadCreate(SQLModel):
    category: str = Field(min_length=1, max_length=80)
    monthly_cost: float = Field(ge=0)
    effective_from: datetime | None = None


class OverheadPublic(SQLModel):
    id: uuid.UUID
    category: str
    monthly_cost: float
    effective_from: datetime


class Dashboard(SQLModel):
    gross_current_month: float
    gross_last_90_days: float
    gross_ytd: float
    cogs_current_month: float
    cogs_last_90_days: float
    cogs_ytd: float
    net_margin_pct: float
    top_crops: list[dict]
    channel_revenue: list[dict]
