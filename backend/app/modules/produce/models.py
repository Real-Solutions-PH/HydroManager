import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.modules.produce.schema import (
    ProduceBase,
    ProduceMovementType,
    ProduceStatus,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Produce(ProduceBase, table=True):
    __tablename__ = "produce"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    source_batch_id: uuid.UUID | None = Field(
        default=None, foreign_key="batch.id", ondelete="SET NULL"
    )
    status: ProduceStatus = Field(default=ProduceStatus.ready)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    movements: list["ProduceMovement"] = Relationship(
        back_populates="produce",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ProduceMovement(SQLModel, table=True):
    __tablename__ = "produce_movement"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    produce_id: uuid.UUID = Field(
        foreign_key="produce.id", nullable=False, ondelete="CASCADE"
    )
    movement_type: ProduceMovementType
    quantity: float
    related_sale_id: uuid.UUID | None = Field(
        default=None, foreign_key="sale.id", ondelete="SET NULL"
    )
    occurred_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    notes: str | None = Field(default=None, max_length=500)

    produce: Produce | None = Relationship(back_populates="movements")
