import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.modules.setups.schema import SetupBase, SlotStatus


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Setup(SetupBase, table=True):
    __tablename__ = "setup"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    archived_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    slots: list["SetupSlot"] = Relationship(
        back_populates="setup",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    photos: list["SetupPhoto"] = Relationship(
        back_populates="setup",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class SetupSlot(SQLModel, table=True):
    __tablename__ = "setup_slot"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    setup_id: uuid.UUID = Field(
        foreign_key="setup.id", nullable=False, ondelete="CASCADE"
    )
    batch_id: uuid.UUID | None = Field(
        default=None, foreign_key="batch.id", nullable=True, ondelete="SET NULL"
    )
    slot_code: str = Field(max_length=40)
    position_index: int
    status: SlotStatus = Field(default=SlotStatus.EMPTY)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    setup: Setup | None = Relationship(back_populates="slots")


class SetupPhoto(SQLModel, table=True):
    __tablename__ = "setup_photo"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    setup_id: uuid.UUID = Field(
        foreign_key="setup.id", nullable=False, ondelete="CASCADE"
    )
    storage_url: str = Field(max_length=500)
    uploaded_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    setup: Setup | None = Relationship(back_populates="photos")
