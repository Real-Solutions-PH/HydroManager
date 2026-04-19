import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.modules.sales.schema import PaymentStatus, SaleChannel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Sale(SQLModel, table=True):
    __tablename__ = "sale"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    buyer_label: str | None = Field(default=None, max_length=120)
    channel: SaleChannel = Field(default=SaleChannel.direct)
    sold_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    payment_status: PaymentStatus = Field(default=PaymentStatus.paid)
    notes: str | None = Field(default=None, max_length=500)

    items: list["SaleItem"] = Relationship(
        back_populates="sale",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class SaleItem(SQLModel, table=True):
    __tablename__ = "sale_item"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sale_id: uuid.UUID = Field(
        foreign_key="sale.id", nullable=False, ondelete="CASCADE"
    )
    crop_name: str = Field(max_length=120)
    quantity: float
    unit: str = Field(max_length=20)
    unit_price: float
    linked_batch_id: uuid.UUID | None = Field(
        default=None, foreign_key="batch.id", ondelete="SET NULL"
    )

    sale: Sale | None = Relationship(back_populates="items")


class OverheadCost(SQLModel, table=True):
    __tablename__ = "overhead_cost"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    category: str = Field(max_length=80)
    monthly_cost: float
    effective_from: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
