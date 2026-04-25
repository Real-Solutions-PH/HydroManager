import uuid
from datetime import date, timedelta
from typing import Any

from sqlmodel import Session, col, func, select

from app.modules.produce.models import Produce, ProduceMovement

NEAR_EXPIRY_DAYS = 3


def get_by_id(*, session: Session, produce_id: uuid.UUID) -> Produce | None:
    return session.get(Produce, produce_id)


def get_multi(
    *,
    session: Session,
    owner_id: uuid.UUID | None = None,
    status: str | None = None,
    near_expiry: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Produce], int]:
    count_q = select(func.count()).select_from(Produce)
    list_q = (
        select(Produce)
        .order_by(col(Produce.harvested_at).desc())
        .offset(skip)
        .limit(limit)
    )
    if owner_id is not None:
        count_q = count_q.where(Produce.owner_id == owner_id)
        list_q = list_q.where(Produce.owner_id == owner_id)
    if status is not None:
        count_q = count_q.where(Produce.status == status)
        list_q = list_q.where(Produce.status == status)
    if near_expiry:
        cutoff = date.today() + timedelta(days=NEAR_EXPIRY_DAYS)
        count_q = count_q.where(Produce.expiry_date <= cutoff)
        list_q = list_q.where(Produce.expiry_date <= cutoff)
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def create(*, session: Session, produce: Produce) -> Produce:
    session.add(produce)
    session.commit()
    session.refresh(produce)
    return produce


def update(
    *, session: Session, produce: Produce, update_data: dict[str, Any]
) -> Produce:
    produce.sqlmodel_update(update_data)
    session.add(produce)
    session.commit()
    session.refresh(produce)
    return produce


def delete(*, session: Session, produce: Produce) -> None:
    session.delete(produce)
    session.commit()


def add_movement(
    *, session: Session, movement: ProduceMovement
) -> ProduceMovement:
    session.add(movement)
    return movement


def list_movements(
    *, session: Session, produce_id: uuid.UUID, limit: int = 50
) -> list[ProduceMovement]:
    q = (
        select(ProduceMovement)
        .where(ProduceMovement.produce_id == produce_id)
        .order_by(col(ProduceMovement.occurred_at).desc())
        .limit(limit)
    )
    return list(session.exec(q).all())
