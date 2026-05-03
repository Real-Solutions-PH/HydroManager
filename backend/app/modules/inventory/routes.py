import uuid
from datetime import date
from typing import Any

from fastapi import APIRouter
from sqlmodel import col, select

from app.modules.iam.deps import CurrentUser
from app.modules.inventory import services as inv_service
from app.modules.inventory.models import InventoryMovement
from app.modules.inventory.schema import (
    ExpiryStatus,
    InventoryCategory,
    InventoryItemCreate,
    InventoryItemPublic,
    InventoryItemsPublic,
    InventoryItemUpdate,
    MovementCreate,
    MovementPublic,
    MovementType,
)
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/inventory", tags=["inventory"])

EXPIRY_WARNING_DAYS = 7


def _compute_expiry(item) -> tuple[ExpiryStatus, int | None]:
    if item.expiry_date is None:
        return ExpiryStatus.ok, None
    days = (item.expiry_date - date.today()).days
    if days < 0:
        return ExpiryStatus.expired, days
    if days <= EXPIRY_WARNING_DAYS:
        return ExpiryStatus.warning, days
    return ExpiryStatus.ok, days


def _to_public(item, *, session=None) -> InventoryItemPublic:
    pub = InventoryItemPublic.model_validate(item, from_attributes=True)
    pub.is_low_stock = (
        item.low_stock_threshold is not None
        and item.current_stock <= item.low_stock_threshold
    )
    pub.expiry_status, pub.days_until_expiry = _compute_expiry(item)
    if session is not None:
        q = (
            select(InventoryMovement.occurred_at)
            .where(
                InventoryMovement.item_id == item.id,
                InventoryMovement.movement_type == MovementType.restock,
            )
            .order_by(col(InventoryMovement.occurred_at).desc())
            .limit(1)
        )
        row = session.exec(q).first()
        pub.last_restocked_at = row if row else None
    return pub


@router.get("/items", response_model=InventoryItemsPublic)
def list_items(
    session: SessionDep,
    current_user: CurrentUser,
    category: InventoryCategory | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = inv_service.list_items(
        session=session,
        current_user=current_user,
        category=category.value if category else None,
        skip=skip,
        limit=limit,
    )
    return InventoryItemsPublic(
        data=[_to_public(r, session=session) for r in rows], count=count
    )


@router.post("/items", response_model=InventoryItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, data: InventoryItemCreate
) -> Any:
    item = inv_service.create_item(
        session=session, current_user=current_user, data=data
    )
    return _to_public(item, session=session)


@router.get("/items/{id}", response_model=InventoryItemPublic)
def read_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    item = inv_service.get_item(
        session=session, current_user=current_user, item_id=id
    )
    return _to_public(item, session=session)


@router.put("/items/{id}", response_model=InventoryItemPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: InventoryItemUpdate,
) -> Any:
    item = inv_service.update_item(
        session=session, current_user=current_user, item_id=id, data=data
    )
    return _to_public(item, session=session)


@router.delete("/items/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    inv_service.delete_item(
        session=session, current_user=current_user, item_id=id
    )
    return Message(message="Item deleted successfully")


@router.post("/items/{id}/movements", response_model=MovementPublic)
def create_movement(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: MovementCreate,
) -> Any:
    return inv_service.record_movement(
        session=session, current_user=current_user, item_id=id, data=data
    )


@router.get("/items/{id}/movements", response_model=list[MovementPublic])
def list_movements(
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    limit: int = 50,
) -> Any:
    rows = inv_service.list_movements(
        session=session, current_user=current_user, item_id=id, limit=limit
    )
    return [MovementPublic.model_validate(r, from_attributes=True) for r in rows]
