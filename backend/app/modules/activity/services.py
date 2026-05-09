import uuid
from typing import Any

from sqlmodel import Session, col, func, select

from app.modules.activity.models import Activity
from app.modules.activity.schema import ActivityType, TargetType
from app.modules.iam.users.models import User


def record(
    *,
    session: Session,
    user_id: uuid.UUID,
    action_type: ActivityType,
    summary: str,
    target_type: TargetType | None = None,
    target_id: uuid.UUID | None = None,
    meta: dict[str, Any] | None = None,
    commit: bool = False,
) -> Activity:
    """Append an activity row.

    Caller usually defers commit to the surrounding transaction. Pass
    `commit=True` for fire-and-forget call sites.
    """
    activity = Activity(
        user_id=user_id,
        action_type=action_type,
        target_type=target_type,
        target_id=target_id,
        summary=summary[:240],
        meta=meta,
    )
    session.add(activity)
    if commit:
        session.commit()
        session.refresh(activity)
    else:
        session.flush()
    return activity


def list_activities(
    *,
    session: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Activity], int]:
    base = select(Activity)
    count_q = select(func.count()).select_from(Activity)
    if not current_user.is_superuser:
        base = base.where(Activity.user_id == current_user.id)
        count_q = count_q.where(Activity.user_id == current_user.id)
    list_q = (
        base.order_by(col(Activity.created_at).desc()).offset(skip).limit(limit)
    )
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count
