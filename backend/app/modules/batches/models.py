import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.modules.batches.schema import BatchBase, Milestone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Batch(BatchBase, table=True):
    __tablename__ = "batch"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    started_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    archived_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    state_counts: list["BatchStateCount"] = Relationship(
        back_populates="batch",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    transitions: list["BatchTransition"] = Relationship(
        back_populates="batch",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    harvests: list["BatchHarvest"] = Relationship(
        back_populates="batch",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class BatchStateCount(SQLModel, table=True):
    __tablename__ = "batch_state_count"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    batch_id: uuid.UUID = Field(
        foreign_key="batch.id", nullable=False, ondelete="CASCADE"
    )
    milestone_code: Milestone
    count: int
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    batch: Batch | None = Relationship(back_populates="state_counts")


class BatchTransition(SQLModel, table=True):
    __tablename__ = "batch_transition"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    batch_id: uuid.UUID = Field(
        foreign_key="batch.id", nullable=False, ondelete="CASCADE"
    )
    from_milestone: Milestone
    to_milestone: Milestone
    count: int
    occurred_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    notes: str | None = Field(default=None, max_length=500)
    photo_url: str | None = Field(default=None, max_length=500)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )

    batch: Batch | None = Relationship(back_populates="transitions")


class BatchHarvest(SQLModel, table=True):
    __tablename__ = "batch_harvest"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    batch_id: uuid.UUID = Field(
        foreign_key="batch.id", nullable=False, ondelete="CASCADE"
    )
    weight_grams: float
    count: int
    harvested_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    notes: str | None = Field(default=None, max_length=500)

    batch: Batch | None = Relationship(back_populates="harvests")
