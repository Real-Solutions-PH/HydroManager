import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, col, func, select

from app.modules.batches.models import (
    Batch,
    BatchHarvest,
    BatchStateCount,
    BatchTransition,
)
from app.modules.batches.schema import Milestone


def get_by_id(*, session: Session, batch_id: uuid.UUID) -> Batch | None:
    return session.get(Batch, batch_id)


def get_multi(
    *,
    session: Session,
    owner_id: uuid.UUID | None = None,
    setup_id: uuid.UUID | None = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Batch], int]:
    count_q = select(func.count()).select_from(Batch)
    list_q = (
        select(Batch).order_by(col(Batch.started_at).desc()).offset(skip).limit(limit)
    )
    if owner_id is not None:
        count_q = count_q.where(Batch.owner_id == owner_id)
        list_q = list_q.where(Batch.owner_id == owner_id)
    if setup_id is not None:
        count_q = count_q.where(Batch.setup_id == setup_id)
        list_q = list_q.where(Batch.setup_id == setup_id)
    if not include_archived:
        count_q = count_q.where(Batch.archived_at.is_(None))  # type: ignore
        list_q = list_q.where(Batch.archived_at.is_(None))  # type: ignore
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def create(*, session: Session, batch: Batch) -> Batch:
    session.add(batch)
    session.flush()
    session.add(
        BatchStateCount(
            batch_id=batch.id,
            milestone_code=Milestone.Sowed,
            count=batch.initial_count,
        )
    )
    session.commit()
    session.refresh(batch)
    return batch


def update(*, session: Session, batch: Batch, update_data: dict[str, Any]) -> Batch:
    batch.sqlmodel_update(update_data)
    session.add(batch)
    session.commit()
    session.refresh(batch)
    return batch


def delete(*, session: Session, batch: Batch) -> None:
    session.delete(batch)
    session.commit()


def list_state_counts(
    *, session: Session, batch_id: uuid.UUID
) -> list[BatchStateCount]:
    q = select(BatchStateCount).where(BatchStateCount.batch_id == batch_id)
    return list(session.exec(q).all())


def get_state_count(
    *, session: Session, batch_id: uuid.UUID, milestone: Milestone
) -> BatchStateCount | None:
    q = select(BatchStateCount).where(
        BatchStateCount.batch_id == batch_id,
        BatchStateCount.milestone_code == milestone,
    )
    return session.exec(q).one_or_none()


def upsert_state_count(
    *,
    session: Session,
    batch_id: uuid.UUID,
    milestone: Milestone,
    delta: int,
) -> BatchStateCount:
    existing = get_state_count(
        session=session, batch_id=batch_id, milestone=milestone
    )
    if existing is None:
        existing = BatchStateCount(
            batch_id=batch_id, milestone_code=milestone, count=max(delta, 0)
        )
        session.add(existing)
    else:
        existing.count = max(existing.count + delta, 0)
        existing.updated_at = datetime.now(timezone.utc)
        session.add(existing)
    return existing


def add_transition(
    *, session: Session, transition: BatchTransition
) -> BatchTransition:
    session.add(transition)
    return transition


def list_transitions(
    *, session: Session, batch_id: uuid.UUID, limit: int = 20
) -> list[BatchTransition]:
    q = (
        select(BatchTransition)
        .where(BatchTransition.batch_id == batch_id)
        .order_by(col(BatchTransition.occurred_at).desc())
        .limit(limit)
    )
    return list(session.exec(q).all())


def add_harvest(*, session: Session, harvest: BatchHarvest) -> BatchHarvest:
    session.add(harvest)
    return harvest


def list_harvests(*, session: Session, batch_id: uuid.UUID) -> list[BatchHarvest]:
    q = (
        select(BatchHarvest)
        .where(BatchHarvest.batch_id == batch_id)
        .order_by(col(BatchHarvest.harvested_at).desc())
    )
    return list(session.exec(q).all())
