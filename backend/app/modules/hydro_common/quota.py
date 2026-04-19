"""Tier-based quota enforcement."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import DateTime
from sqlmodel import Field, Session, SQLModel, select

from app.modules.iam.users.schema import UserTier


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AIQuotaUsage(SQLModel, table=True):
    __tablename__ = "ai_quota_usage"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE", index=True
    )
    period_start: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    messages_used: int = 0


AI_MONTHLY_QUOTAS: dict[UserTier, int] = {
    UserTier.free: 10,
    UserTier.grower: 150,
    UserTier.pro: 1500,
}

SETUP_LIMITS: dict[UserTier, int] = {
    UserTier.free: 1,
    UserTier.grower: 5,
    UserTier.pro: 20,
}

ACTIVE_BATCH_LIMITS: dict[UserTier, int] = {
    UserTier.free: 3,
    UserTier.grower: 9999,
    UserTier.pro: 9999,
}


def _current_period_start() -> datetime:
    now = _utcnow()
    return datetime(now.year, now.month, 1, tzinfo=timezone.utc)


def get_or_create_usage(
    *, session: Session, user_id: uuid.UUID
) -> AIQuotaUsage:
    period = _current_period_start()
    q = select(AIQuotaUsage).where(
        AIQuotaUsage.user_id == user_id,
        AIQuotaUsage.period_start == period,
    )
    row = session.exec(q).one_or_none()
    if row is None:
        row = AIQuotaUsage(
            user_id=user_id, period_start=period, messages_used=0
        )
        session.add(row)
        session.flush()
    return row


def ensure_ai_quota(
    *, session: Session, user_id: uuid.UUID, tier: UserTier
) -> AIQuotaUsage:
    usage = get_or_create_usage(session=session, user_id=user_id)
    limit = AI_MONTHLY_QUOTAS[tier]
    if usage.messages_used >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"AI quota exhausted for {tier.value} tier ({limit}/mo). Upgrade to continue.",
        )
    return usage


def consume_ai_message(*, session: Session, user_id: uuid.UUID) -> None:
    usage = get_or_create_usage(session=session, user_id=user_id)
    usage.messages_used += 1
    session.add(usage)


def require_tier(user_tier: UserTier, *, at_least: UserTier) -> None:
    order = {UserTier.free: 0, UserTier.grower: 1, UserTier.pro: 2}
    if order[user_tier] < order[at_least]:
        raise HTTPException(
            status_code=403,
            detail=f"This feature requires {at_least.value} tier or higher.",
        )


def enforce_setup_limit(
    *, session: Session, user_id: uuid.UUID, tier: UserTier
) -> None:
    from app.modules.setups.models import Setup
    q = select(Setup).where(
        Setup.owner_id == user_id, Setup.archived_at.is_(None)  # type: ignore
    )
    count = len(list(session.exec(q).all()))
    limit = SETUP_LIMITS[tier]
    if count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"{tier.value} tier limited to {limit} setup(s). Upgrade to add more.",
        )


def enforce_active_batch_limit(
    *, session: Session, user_id: uuid.UUID, tier: UserTier
) -> None:
    from app.modules.batches.models import Batch
    q = select(Batch).where(
        Batch.owner_id == user_id, Batch.archived_at.is_(None)  # type: ignore
    )
    count = len(list(session.exec(q).all()))
    limit = ACTIVE_BATCH_LIMITS[tier]
    if count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"{tier.value} tier limited to {limit} active batches.",
        )
