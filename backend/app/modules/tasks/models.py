import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field

from app.modules.tasks.schema import TaskBase


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(TaskBase, table=True):
    __tablename__ = "task"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    due_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    completed_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    last_completed_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
