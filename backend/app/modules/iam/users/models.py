import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field

from app.modules.iam.users.schema import UserBase


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
