import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session

from app.modules.activity import services as activity_service
from app.modules.activity.schema import ActivityType, TargetType
from app.modules.iam.users.models import User
from app.modules.inventory import repo as inv_repo
from app.modules.inventory.models import InventoryItem, InventoryMovement
from app.modules.inventory.schema import (
    InventoryItemCreate,
    InventoryItemUpdate,
    MovementCreate,
    MovementType,
)


def _authorize(item: InventoryItem, user: User) -> None:
    if not user.is_superuser and item.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def list_items(
    *,
    session: Session,
    current_user: User,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[InventoryItem], int]:
    owner_id = None if current_user.is_superuser else current_user.id
    return inv_repo.get_multi(
        session=session,
        owner_id=owner_id,
        category=category,
        skip=skip,
        limit=limit,
    )


def get_item(
    *, session: Session, current_user: User, item_id: uuid.UUID
) -> InventoryItem:
    item = inv_repo.get_by_id(session=session, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _authorize(item, current_user)
    return item


def create_item(
    *, session: Session, current_user: User, data: InventoryItemCreate
) -> InventoryItem:
    db = InventoryItem.model_validate(data, update={"owner_id": current_user.id})
    item = inv_repo.create(session=session, item=db)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.inventory_created,
        target_type=TargetType.inventory_item,
        target_id=item.id,
        summary=f"Inventory item added: {item.name}",
        meta={"category": item.category.value, "unit": item.unit.value},
        commit=True,
    )
    return item


def update_item(
    *,
    session: Session,
    current_user: User,
    item_id: uuid.UUID,
    data: InventoryItemUpdate,
) -> InventoryItem:
    item = get_item(
        session=session, current_user=current_user, item_id=item_id
    )
    return inv_repo.update(
        session=session, item=item, update_data=data.model_dump(exclude_unset=True)
    )


def delete_item(
    *, session: Session, current_user: User, item_id: uuid.UUID
) -> None:
    item = get_item(
        session=session, current_user=current_user, item_id=item_id
    )
    name = item.name
    item_id_val = item.id
    inv_repo.delete(session=session, item=item)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.inventory_deleted,
        target_type=TargetType.inventory_item,
        target_id=item_id_val,
        summary=f"Inventory item deleted: {name}",
        commit=True,
    )


def record_movement(
    *,
    session: Session,
    current_user: User,
    item_id: uuid.UUID,
    data: MovementCreate,
) -> InventoryMovement:
    item = get_item(
        session=session, current_user=current_user, item_id=item_id
    )
    if data.movement_type == MovementType.restock:
        item.current_stock = max(item.current_stock + data.quantity, 0)
    elif data.movement_type == MovementType.consume:
        if data.quantity > item.current_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Only {item.current_stock} {item.unit.value} available",
            )
        item.current_stock = max(item.current_stock - data.quantity, 0)
    else:
        item.current_stock = max(data.quantity, 0)
    session.add(item)
    movement = InventoryMovement(
        item_id=item.id,
        movement_type=data.movement_type,
        quantity=data.quantity,
        cost_total=data.cost_total,
        related_batch_id=data.related_batch_id,
        occurred_at=data.occurred_at or datetime.now(timezone.utc),
        notes=data.notes,
    )
    inv_repo.add_movement(session=session, movement=movement)
    if data.movement_type == MovementType.restock:
        action = ActivityType.inventory_restocked
        verb = "restocked"
    elif data.movement_type == MovementType.consume:
        action = ActivityType.inventory_consumed
        verb = "consumed"
    else:
        action = ActivityType.inventory_adjusted
        verb = "adjusted"
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=action,
        target_type=TargetType.inventory_item,
        target_id=item.id,
        summary=f"{item.name} {verb} ({data.quantity:g} {item.unit.value})",
        meta={
            "movement_type": data.movement_type.value,
            "quantity": data.quantity,
            "cost_total": data.cost_total,
        },
    )
    session.commit()
    session.refresh(movement)
    return movement


def list_movements(
    *, session: Session, current_user: User, item_id: uuid.UUID, limit: int = 50
):
    item = get_item(
        session=session, current_user=current_user, item_id=item_id
    )
    return inv_repo.list_movements(session=session, item_id=item.id, limit=limit)
