import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import nullslast
from sqlmodel import Session, col, func, select

from app.modules.tasks.models import Task


def get_by_id(*, session: Session, task_id: uuid.UUID) -> Task | None:
    return session.get(Task, task_id)


def get_multi(
    *,
    session: Session,
    owner_id: uuid.UUID,
    include_completed: bool = False,
    due_before: datetime | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Task], int]:
    count_q = select(func.count()).select_from(Task).where(Task.owner_id == owner_id)
    list_q = select(Task).where(Task.owner_id == owner_id)
    if not include_completed:
        count_q = count_q.where(Task.completed_at.is_(None))  # type: ignore
        list_q = list_q.where(Task.completed_at.is_(None))  # type: ignore
    if due_before is not None:
        count_q = count_q.where(
            Task.due_at.is_not(None),  # type: ignore
            Task.due_at <= due_before,
        )
        list_q = list_q.where(
            Task.due_at.is_not(None),  # type: ignore
            Task.due_at <= due_before,
        )
    list_q = (
        list_q.order_by(nullslast(col(Task.due_at).asc()), col(Task.created_at).asc())
        .offset(skip)
        .limit(limit)
    )
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def create(*, session: Session, task: Task) -> Task:
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def update(*, session: Session, task: Task, update_data: dict[str, Any]) -> Task:
    task.sqlmodel_update(update_data)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete(*, session: Session, task: Task) -> None:
    session.delete(task)
    session.commit()
