import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class TaskPriority(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"
    none = "none"


class RecurFreq(str, Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class TaskBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=2000)
    priority: TaskPriority = Field(default=TaskPriority.none)
    due_at: datetime | None = None
    recur_freq: RecurFreq = Field(default=RecurFreq.none)
    recur_interval: int = Field(default=1, ge=1, le=365)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=2000)
    priority: TaskPriority | None = None
    due_at: datetime | None = None
    recur_freq: RecurFreq | None = None
    recur_interval: int | None = Field(default=None, ge=1, le=365)


class TaskPublic(TaskBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    completed_at: datetime | None = None
    last_completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TasksPublic(SQLModel):
    data: list[TaskPublic]
    count: int
