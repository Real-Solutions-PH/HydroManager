import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel

from app.modules.activity.schema import ActivityType, TargetType


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Activity(SQLModel, table=True):
    __tablename__ = "activity"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True
    )
    action_type: ActivityType = Field(index=True)
    target_type: TargetType | None = Field(default=None)
    target_id: uuid.UUID | None = Field(default=None)
    summary: str = Field(max_length=240)
    meta: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
        index=True,
    )
