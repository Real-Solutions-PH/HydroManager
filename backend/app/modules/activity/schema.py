import uuid
from datetime import datetime
from enum import Enum
from typing import Any

from sqlmodel import SQLModel


class ActivityType(str, Enum):
    setup_created = "setup_created"
    setup_archived = "setup_archived"
    setup_unarchived = "setup_unarchived"
    setup_deleted = "setup_deleted"
    batch_created = "batch_created"
    batch_archived = "batch_archived"
    batch_deleted = "batch_deleted"
    batch_transition = "batch_transition"
    batch_harvest = "batch_harvest"
    inventory_created = "inventory_created"
    inventory_restocked = "inventory_restocked"
    inventory_consumed = "inventory_consumed"
    inventory_adjusted = "inventory_adjusted"
    inventory_deleted = "inventory_deleted"
    produce_created = "produce_created"
    produce_movement = "produce_movement"
    sale_recorded = "sale_recorded"
    sale_deleted = "sale_deleted"
    overhead_added = "overhead_added"


class TargetType(str, Enum):
    setup = "setup"
    batch = "batch"
    inventory_item = "inventory_item"
    produce = "produce"
    sale = "sale"
    overhead = "overhead"


class ActivityPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    action_type: ActivityType
    target_type: TargetType | None = None
    target_id: uuid.UUID | None = None
    summary: str
    meta: dict[str, Any] | None = None
    created_at: datetime


class ActivitiesPublic(SQLModel):
    data: list[ActivityPublic]
    count: int
