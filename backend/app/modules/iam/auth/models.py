import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RefreshToken(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE", index=True)
    # SHA-256 hex of the opaque token; the plaintext is never stored.
    token_hash: str = Field(unique=True, index=True)
    expires_at: datetime = Field(sa_type=DateTime(timezone=True))  # type: ignore
    created_at: datetime | None = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
