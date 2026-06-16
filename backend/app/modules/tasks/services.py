import calendar
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlmodel import Session

from app.modules.iam.users.models import User
from app.modules.tasks import repo as tasks_repo
from app.modules.tasks.models import Task
from app.modules.tasks.schema import RecurFreq, TaskCreate, TaskUpdate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _authorize(task: Task, user: User) -> None:
    if not user.is_superuser and task.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def _add_months(dt: datetime, months: int) -> datetime:
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _advance(dt: datetime, freq: RecurFreq, interval: int) -> datetime:
    if freq == RecurFreq.daily:
        return dt + timedelta(days=interval)
    if freq == RecurFreq.weekly:
        return dt + timedelta(weeks=interval)
    if freq == RecurFreq.monthly:
        return _add_months(dt, interval)
    return dt


def _next_due(due_at: datetime, freq: RecurFreq, interval: int) -> datetime:
    """Next occurrence after ``due_at`` that lies in the future.

    Advances at least one interval, then skips any missed runs so a long-stale
    recurring task lands on its next future slot rather than piling up.
    """
    if freq == RecurFreq.none:
        return due_at
    now = _utcnow()
    nxt = _advance(due_at, freq, interval)
    while nxt <= now:
        nxt = _advance(nxt, freq, interval)
    return nxt


def list_tasks(
    *,
    session: Session,
    current_user: User,
    include_completed: bool = False,
    due_before: datetime | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Task], int]:
    return tasks_repo.get_multi(
        session=session,
        owner_id=current_user.id,
        include_completed=include_completed,
        due_before=due_before,
        skip=skip,
        limit=limit,
    )


def get_task(*, session: Session, current_user: User, task_id: uuid.UUID) -> Task:
    task = tasks_repo.get_by_id(session=session, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _authorize(task, current_user)
    return task


def create_task(*, session: Session, current_user: User, data: TaskCreate) -> Task:
    task = Task.model_validate({**data.model_dump(), "owner_id": current_user.id})
    return tasks_repo.create(session=session, task=task)


def update_task(
    *, session: Session, current_user: User, task_id: uuid.UUID, data: TaskUpdate
) -> Task:
    task = get_task(session=session, current_user=current_user, task_id=task_id)
    update_data = data.model_dump(exclude_unset=True)
    update_data["updated_at"] = _utcnow()
    return tasks_repo.update(session=session, task=task, update_data=update_data)


def complete_task(*, session: Session, current_user: User, task_id: uuid.UUID) -> Task:
    task = get_task(session=session, current_user=current_user, task_id=task_id)
    now = _utcnow()
    update_data: dict = {"updated_at": now}
    if task.recur_freq == RecurFreq.none:
        update_data["completed_at"] = now
    else:
        update_data["last_completed_at"] = now
        if task.due_at is not None:
            update_data["due_at"] = _next_due(
                task.due_at, task.recur_freq, task.recur_interval
            )
    return tasks_repo.update(session=session, task=task, update_data=update_data)


def uncomplete_task(
    *, session: Session, current_user: User, task_id: uuid.UUID
) -> Task:
    task = get_task(session=session, current_user=current_user, task_id=task_id)
    return tasks_repo.update(
        session=session,
        task=task,
        update_data={"completed_at": None, "updated_at": _utcnow()},
    )


def delete_task(*, session: Session, current_user: User, task_id: uuid.UUID) -> None:
    task = get_task(session=session, current_user=current_user, task_id=task_id)
    tasks_repo.delete(session=session, task=task)
