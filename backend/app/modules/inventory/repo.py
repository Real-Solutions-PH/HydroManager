import uuid
from typing import Any

from sqlmodel import Session, col, func, select

from app.modules.inventory.models import InventoryItem, InventoryMovement


def get_by_id(*, session: Session, item_id: uuid.UUID) -> InventoryItem | None:
    return session.get(InventoryItem, item_id)


def get_multi(
    *,
    session: Session,
    owner_id: uuid.UUID | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[InventoryItem], int]:
    count_q = select(func.count()).select_from(InventoryItem)
    list_q = (
        select(InventoryItem)
        .order_by(col(InventoryItem.name).asc())
        .offset(skip)
        .limit(limit)
    )
    if owner_id is not None:
        count_q = count_q.where(InventoryItem.owner_id == owner_id)
        list_q = list_q.where(InventoryItem.owner_id == owner_id)
    if category is not None:
        count_q = count_q.where(InventoryItem.category == category)
        list_q = list_q.where(InventoryItem.category == category)
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def create(*, session: Session, item: InventoryItem) -> InventoryItem:
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def update(
    *, session: Session, item: InventoryItem, update_data: dict[str, Any]
) -> InventoryItem:
    item.sqlmodel_update(update_data)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete(*, session: Session, item: InventoryItem) -> None:
    session.delete(item)
    session.commit()


def add_movement(
    *, session: Session, movement: InventoryMovement
) -> InventoryMovement:
    session.add(movement)
    return movement


def list_movements(
    *, session: Session, item_id: uuid.UUID, limit: int = 50
) -> list[InventoryMovement]:
    q = (
        select(InventoryMovement)
        .where(InventoryMovement.item_id == item_id)
        .order_by(col(InventoryMovement.occurred_at).desc())
        .limit(limit)
    )
    return list(session.exec(q).all())
