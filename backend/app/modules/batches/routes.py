import uuid
from typing import Any

from fastapi import APIRouter

from app.modules.batches import services as batches_service
from app.modules.batches.schema import (
    BatchAllocateSlots,
    BatchCreate,
    BatchDetail,
    BatchesPublic,
    BatchHarvestCreate,
    BatchHarvestPublic,
    BatchPublic,
    BatchStateCountPublic,
    BatchTransitionCreate,
    BatchTransitionPublic,
    BatchUpdate,
)
from app.modules.iam.deps import CurrentUser
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/batches", tags=["batches"])


@router.get("/", response_model=BatchesPublic)
def list_batches(
    session: SessionDep,
    current_user: CurrentUser,
    setup_id: uuid.UUID | None = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = batches_service.list_batches(
        session=session,
        current_user=current_user,
        setup_id=setup_id,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )
    data = [
        BatchPublic.model_validate(
            {**r.model_dump(), "legacy": r.slots_used is None},
        )
        for r in rows
    ]
    return BatchesPublic(data=data, count=count)


@router.post("/", response_model=BatchPublic)
def create_batch(
    *, session: SessionDep, current_user: CurrentUser, data: BatchCreate
) -> Any:
    return batches_service.create_batch(
        session=session, current_user=current_user, data=data
    )


@router.get("/{id}", response_model=BatchDetail)
def read_batch(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    batch = batches_service.get_batch(
        session=session, current_user=current_user, batch_id=id
    )
    counts = batches_service.list_state_counts(
        session=session, current_user=current_user, batch_id=id
    )
    recent = batches_service.list_transitions(
        session=session, current_user=current_user, batch_id=id, limit=10
    )
    return BatchDetail(
        **BatchPublic.model_validate(
            {**batch.model_dump(), "legacy": batch.slots_used is None},
        ).model_dump(),
        state_counts=[
            BatchStateCountPublic.model_validate(c, from_attributes=True)
            for c in counts
        ],
        recent_transitions=[
            BatchTransitionPublic.model_validate(t, from_attributes=True)
            for t in recent
        ],
    )


@router.put("/{id}", response_model=BatchPublic)
def update_batch(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: BatchUpdate,
) -> Any:
    return batches_service.update_batch(
        session=session, current_user=current_user, batch_id=id, data=data
    )


@router.post("/{id}/allocate-slots", response_model=BatchPublic)
def allocate_slots(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: BatchAllocateSlots,
) -> Any:
    return batches_service.allocate_slots(
        session=session,
        current_user=current_user,
        batch_id=id,
        slots_used=data.slots_used,
        seeds_per_slot=data.seeds_per_slot,
    )


@router.post("/{id}/archive", response_model=BatchPublic)
def archive_batch(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    return batches_service.archive_batch(
        session=session, current_user=current_user, batch_id=id
    )


@router.delete("/{id}")
def delete_batch(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    batches_service.delete_batch(
        session=session, current_user=current_user, batch_id=id
    )
    return Message(message="Batch deleted successfully")


@router.post("/{id}/transitions", response_model=BatchTransitionPublic)
def create_transition(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: BatchTransitionCreate,
) -> Any:
    return batches_service.record_transition(
        session=session, current_user=current_user, batch_id=id, data=data
    )


@router.get("/{id}/transitions", response_model=list[BatchTransitionPublic])
def list_transitions(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    limit: int = 50,
) -> Any:
    rows = batches_service.list_transitions(
        session=session, current_user=current_user, batch_id=id, limit=limit
    )
    return [BatchTransitionPublic.model_validate(r, from_attributes=True) for r in rows]


@router.get("/{id}/state-counts", response_model=list[BatchStateCountPublic])
def state_counts(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    rows = batches_service.list_state_counts(
        session=session, current_user=current_user, batch_id=id
    )
    return [BatchStateCountPublic.model_validate(r, from_attributes=True) for r in rows]


@router.post("/{id}/harvests", response_model=BatchHarvestPublic)
def create_harvest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: BatchHarvestCreate,
) -> Any:
    return batches_service.record_harvest(
        session=session, current_user=current_user, batch_id=id, data=data
    )


@router.get("/{id}/harvests", response_model=list[BatchHarvestPublic])
def list_harvests(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    rows = batches_service.list_harvests(
        session=session, current_user=current_user, batch_id=id
    )
    return [BatchHarvestPublic.model_validate(r, from_attributes=True) for r in rows]
