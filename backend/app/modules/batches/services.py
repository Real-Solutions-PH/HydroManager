import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session

from app.modules.batches import repo as batches_repo
from app.modules.batches.models import Batch, BatchHarvest, BatchTransition
from app.modules.batches.schema import (
    BatchCreate,
    BatchHarvestCreate,
    BatchTransitionCreate,
    BatchUpdate,
    Milestone,
)
from app.modules.hydro_common.quota import enforce_active_batch_limit
from app.modules.iam.users.models import User
from app.modules.setups import repo as setups_repo


def _authorize(batch: Batch, user: User) -> None:
    if not user.is_superuser and batch.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def list_batches(
    *,
    session: Session,
    current_user: User,
    setup_id: uuid.UUID | None = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Batch], int]:
    owner_id = None if current_user.is_superuser else current_user.id
    return batches_repo.get_multi(
        session=session,
        owner_id=owner_id,
        setup_id=setup_id,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )


def get_batch(
    *, session: Session, current_user: User, batch_id: uuid.UUID
) -> Batch:
    batch = batches_repo.get_by_id(session=session, batch_id=batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    _authorize(batch, current_user)
    return batch


def create_batch(
    *, session: Session, current_user: User, data: BatchCreate
) -> Batch:
    setup = setups_repo.get_by_id(session=session, setup_id=data.setup_id)
    if setup is None:
        raise HTTPException(status_code=404, detail="Setup not found")
    if not current_user.is_superuser and setup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not current_user.is_superuser:
        enforce_active_batch_limit(
            session=session, user_id=current_user.id, tier=current_user.tier
        )
    payload = data.model_dump(exclude_none=True)
    payload["owner_id"] = current_user.id
    db = Batch.model_validate(payload)
    return batches_repo.create(session=session, batch=db)


def update_batch(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    data: BatchUpdate,
) -> Batch:
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    return batches_repo.update(
        session=session, batch=batch, update_data=data.model_dump(exclude_unset=True)
    )


def archive_batch(
    *, session: Session, current_user: User, batch_id: uuid.UUID
) -> Batch:
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    return batches_repo.update(
        session=session,
        batch=batch,
        update_data={"archived_at": datetime.now(timezone.utc)},
    )


def delete_batch(
    *, session: Session, current_user: User, batch_id: uuid.UUID
) -> None:
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    batches_repo.delete(session=session, batch=batch)


def record_transition(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    data: BatchTransitionCreate,
) -> BatchTransition:
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    if data.from_milestone == data.to_milestone:
        raise HTTPException(
            status_code=400, detail="from_milestone must differ from to_milestone"
        )
    src = batches_repo.get_state_count(
        session=session, batch_id=batch.id, milestone=data.from_milestone
    )
    available = src.count if src else 0
    if data.count > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} units in {data.from_milestone.value}",
        )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=data.from_milestone,
        delta=-data.count,
    )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=data.to_milestone,
        delta=data.count,
    )
    transition = BatchTransition(
        batch_id=batch.id,
        from_milestone=data.from_milestone,
        to_milestone=data.to_milestone,
        count=data.count,
        occurred_at=data.occurred_at or datetime.now(timezone.utc),
        notes=data.notes,
        photo_url=data.photo_url,
        user_id=current_user.id,
    )
    batches_repo.add_transition(session=session, transition=transition)
    session.commit()
    session.refresh(transition)
    return transition


def list_state_counts(
    *, session: Session, current_user: User, batch_id: uuid.UUID
):
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    return batches_repo.list_state_counts(session=session, batch_id=batch.id)


def list_transitions(
    *, session: Session, current_user: User, batch_id: uuid.UUID, limit: int = 20
):
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    return batches_repo.list_transitions(
        session=session, batch_id=batch.id, limit=limit
    )


def record_harvest(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    data: BatchHarvestCreate,
) -> BatchHarvest:
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    src = batches_repo.get_state_count(
        session=session, batch_id=batch.id, milestone=Milestone.HarvestReady
    )
    available = src.count if src else 0
    if data.count > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} units in HarvestReady",
        )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=Milestone.HarvestReady,
        delta=-data.count,
    )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=Milestone.Harvested,
        delta=data.count,
    )
    harvest = BatchHarvest(
        batch_id=batch.id,
        weight_grams=data.weight_grams,
        count=data.count,
        harvested_at=data.harvested_at or datetime.now(timezone.utc),
        notes=data.notes,
    )
    batches_repo.add_harvest(session=session, harvest=harvest)
    session.commit()
    session.refresh(harvest)
    return harvest


def list_harvests(
    *, session: Session, current_user: User, batch_id: uuid.UUID
):
    batch = get_batch(
        session=session, current_user=current_user, batch_id=batch_id
    )
    return batches_repo.list_harvests(session=session, batch_id=batch.id)
