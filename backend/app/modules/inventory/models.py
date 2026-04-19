import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.modules.inventory.schema import InventoryItemBase, MovementType


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class InventoryItem(InventoryItemBase, table=True):
    __tablename__ = "inventory_item"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    movements: list["InventoryMovement"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class InventoryMovement(SQLModel, table=True):
    __tablename__ = "inventory_movement"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    item_id: uuid.UUID = Field(
        foreign_key="inventory_item.id", nullable=False, ondelete="CASCADE"
    )
    movement_type: MovementType
    quantity: float
    cost_total: float | None = None
    related_batch_id: uuid.UUID | None = Field(
        default=None, foreign_key="batch.id", ondelete="SET NULL"
    )
    occurred_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    notes: str | None = Field(default=None, max_length=500)

    item: InventoryItem | None = Relationship(back_populates="movements")
