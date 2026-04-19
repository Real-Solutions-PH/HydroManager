import uuid
from typing import Any

from fastapi import APIRouter

from app.modules.iam.deps import CurrentUser
from app.modules.inventory import services as inv_service
from app.modules.inventory.schema import (
    InventoryCategory,
    InventoryItemCreate,
    InventoryItemPublic,
    InventoryItemsPublic,
    InventoryItemUpdate,
    MovementCreate,
    MovementPublic,
)
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _to_public(item) -> InventoryItemPublic:
    pub = InventoryItemPublic.model_validate(item, from_attributes=True)
    pub.is_low_stock = (
        item.low_stock_threshold is not None
        and item.current_stock <= item.low_stock_threshold
    )
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
    return InventoryItemsPublic(data=[_to_public(r) for r in rows], count=count)


@router.post("/items", response_model=InventoryItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, data: InventoryItemCreate
) -> Any:
    item = inv_service.create_item(
        session=session, current_user=current_user, data=data
    )
    return _to_public(item)


@router.get("/items/{id}", response_model=InventoryItemPublic)
def read_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    item = inv_service.get_item(
        session=session, current_user=current_user, item_id=id
    )
    return _to_public(item)


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
    return _to_public(item)


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
