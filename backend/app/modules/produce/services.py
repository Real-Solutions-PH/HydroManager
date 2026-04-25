import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session

from app.modules.iam.users.models import User
from app.modules.produce import repo as produce_repo
from app.modules.produce.models import Produce, ProduceMovement
from app.modules.produce.schema import (
    ExpiryStatus,
    ProduceCreate,
    ProduceMovementCreate,
    ProduceMovementType,
    ProduceStatus,
    ProduceUpdate,
)

WARNING_DAYS = 3


def _authorize(produce: Produce, user: User) -> None:
    if not user.is_superuser and produce.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def compute_expiry(produce: Produce) -> tuple[ExpiryStatus, int | None]:
    if produce.expiry_date is None:
        return ExpiryStatus.ok, None
    days = (produce.expiry_date - date.today()).days
    if days < 0:
        return ExpiryStatus.expired, days
    if days <= WARNING_DAYS:
        return ExpiryStatus.warning, days
    return ExpiryStatus.ok, days


def list_produce(
    *,
    session: Session,
    current_user: User,
    status: str | None = None,
    near_expiry: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Produce], int]:
    owner_id = None if current_user.is_superuser else current_user.id
    return produce_repo.get_multi(
        session=session,
        owner_id=owner_id,
        status=status,
        near_expiry=near_expiry,
        skip=skip,
        limit=limit,
    )


def get_produce(
    *, session: Session, current_user: User, produce_id: uuid.UUID
) -> Produce:
    p = produce_repo.get_by_id(session=session, produce_id=produce_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produce not found")
    _authorize(p, current_user)
    return p


def create_produce(
    *, session: Session, current_user: User, data: ProduceCreate
) -> Produce:
    db = Produce.model_validate(data, update={"owner_id": current_user.id})
    return produce_repo.create(session=session, produce=db)


def update_produce(
    *,
    session: Session,
    current_user: User,
    produce_id: uuid.UUID,
    data: ProduceUpdate,
) -> Produce:
    p = get_produce(
        session=session, current_user=current_user, produce_id=produce_id
    )
    return produce_repo.update(
        session=session, produce=p, update_data=data.model_dump(exclude_unset=True)
    )


def delete_produce(
    *, session: Session, current_user: User, produce_id: uuid.UUID
) -> None:
    p = get_produce(
        session=session, current_user=current_user, produce_id=produce_id
    )
    produce_repo.delete(session=session, produce=p)


def record_movement(
    *,
    session: Session,
    current_user: User,
    produce_id: uuid.UUID,
    data: ProduceMovementCreate,
) -> ProduceMovement:
    p = get_produce(
        session=session, current_user=current_user, produce_id=produce_id
    )
    mt = data.movement_type
    if mt == ProduceMovementType.harvest:
        p.quantity += data.quantity
    elif mt in (ProduceMovementType.sell, ProduceMovementType.discard):
        if data.quantity > p.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {p.quantity} {p.unit} available",
            )
        p.quantity -= data.quantity
        if mt == ProduceMovementType.sell and p.quantity == 0:
            p.status = ProduceStatus.sold
    elif mt == ProduceMovementType.reserve:
        p.status = ProduceStatus.reserved
    elif mt == ProduceMovementType.adjust:
        p.quantity = max(p.quantity + data.quantity, 0)

    session.add(p)
    movement = ProduceMovement(
        produce_id=p.id,
        movement_type=mt,
        quantity=data.quantity,
        occurred_at=datetime.now(timezone.utc),
        notes=data.notes,
    )
    produce_repo.add_movement(session=session, movement=movement)
    session.commit()
    session.refresh(movement)
    return movement


def list_movements(
    *,
    session: Session,
    current_user: User,
    produce_id: uuid.UUID,
    limit: int = 50,
):
    p = get_produce(
        session=session, current_user=current_user, produce_id=produce_id
    )
    return produce_repo.list_movements(
        session=session, produce_id=p.id, limit=limit
    )
