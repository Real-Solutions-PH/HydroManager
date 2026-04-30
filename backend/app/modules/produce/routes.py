import uuid
from typing import Any

from fastapi import APIRouter

from app.modules.iam.deps import CurrentUser
from app.modules.produce import services as produce_service
from app.modules.produce.schema import (
    ProduceCreate,
    ProduceMovementCreate,
    ProduceMovementPublic,
    ProduceMovementsPublic,
    ProducePublic,
    ProducesPublic,
    ProduceStatus,
    ProduceUpdate,
)
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/produce", tags=["produce"])


def _to_public(item) -> ProducePublic:
    pub = ProducePublic.model_validate(item, from_attributes=True)
    status, days = produce_service.compute_expiry(item)
    pub.expiry_status = status
    pub.days_until_expiry = days
    return pub


@router.get("/", response_model=ProducesPublic)
def list_produce(
    session: SessionDep,
    current_user: CurrentUser,
    status: ProduceStatus | None = None,
    near_expiry: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = produce_service.list_produce(
        session=session,
        current_user=current_user,
        status=status.value if status else None,
        near_expiry=near_expiry,
        skip=skip,
        limit=limit,
    )
    return ProducesPublic(data=[_to_public(r) for r in rows], count=count)


@router.post("/", response_model=ProducePublic)
def create_produce(
    *, session: SessionDep, current_user: CurrentUser, data: ProduceCreate
) -> Any:
    p = produce_service.create_produce(
        session=session, current_user=current_user, data=data
    )
    return _to_public(p)


@router.get("/near-expiry", response_model=ProducesPublic)
def near_expiry(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = produce_service.list_produce(
        session=session,
        current_user=current_user,
        near_expiry=True,
        skip=skip,
        limit=limit,
    )
    return ProducesPublic(data=[_to_public(r) for r in rows], count=count)


@router.get("/{id}", response_model=ProducePublic)
def read_produce(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    p = produce_service.get_produce(
        session=session, current_user=current_user, produce_id=id
    )
    return _to_public(p)


@router.patch("/{id}", response_model=ProducePublic)
def update_produce(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: ProduceUpdate,
) -> Any:
    p = produce_service.update_produce(
        session=session, current_user=current_user, produce_id=id, data=data
    )
    return _to_public(p)


@router.delete("/{id}")
def delete_produce(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    produce_service.delete_produce(
        session=session, current_user=current_user, produce_id=id
    )
    return Message(message="Produce deleted successfully")


@router.post("/{id}/movements", response_model=ProduceMovementPublic)
def create_movement(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: ProduceMovementCreate,
) -> Any:
    return produce_service.record_movement(
        session=session, current_user=current_user, produce_id=id, data=data
    )


@router.get("/{id}/movements", response_model=ProduceMovementsPublic)
def list_movements(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    limit: int = 50,
) -> Any:
    rows = produce_service.list_movements(
        session=session, current_user=current_user, produce_id=id, limit=limit
    )
    data = [
        ProduceMovementPublic.model_validate(r, from_attributes=True) for r in rows
    ]
    return ProduceMovementsPublic(data=data, count=len(data))
