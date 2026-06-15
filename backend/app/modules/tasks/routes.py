import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter

from app.modules.iam.deps import CurrentUser
from app.modules.tasks import services as tasks_service
from app.modules.tasks.schema import (
    TaskCreate,
    TaskPublic,
    TasksPublic,
    TaskUpdate,
)
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=TasksPublic)
def list_tasks(
    session: SessionDep,
    current_user: CurrentUser,
    include_completed: bool = False,
    due_before: datetime | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = tasks_service.list_tasks(
        session=session,
        current_user=current_user,
        include_completed=include_completed,
        due_before=due_before,
        skip=skip,
        limit=limit,
    )
    return TasksPublic(data=rows, count=count)


@router.post("/", response_model=TaskPublic)
def create_task(
    *, session: SessionDep, current_user: CurrentUser, data: TaskCreate
) -> Any:
    return tasks_service.create_task(
        session=session, current_user=current_user, data=data
    )


@router.get("/{task_id}", response_model=TaskPublic)
def get_task(session: SessionDep, current_user: CurrentUser, task_id: uuid.UUID) -> Any:
    return tasks_service.get_task(
        session=session, current_user=current_user, task_id=task_id
    )


@router.patch("/{task_id}", response_model=TaskPublic)
def update_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    task_id: uuid.UUID,
    data: TaskUpdate,
) -> Any:
    return tasks_service.update_task(
        session=session, current_user=current_user, task_id=task_id, data=data
    )


@router.post("/{task_id}/complete", response_model=TaskPublic)
def complete_task(
    session: SessionDep, current_user: CurrentUser, task_id: uuid.UUID
) -> Any:
    return tasks_service.complete_task(
        session=session, current_user=current_user, task_id=task_id
    )


@router.post("/{task_id}/uncomplete", response_model=TaskPublic)
def uncomplete_task(
    session: SessionDep, current_user: CurrentUser, task_id: uuid.UUID
) -> Any:
    return tasks_service.uncomplete_task(
        session=session, current_user=current_user, task_id=task_id
    )


@router.delete("/{task_id}", response_model=Message)
def delete_task(
    session: SessionDep, current_user: CurrentUser, task_id: uuid.UUID
) -> Any:
    tasks_service.delete_task(
        session=session, current_user=current_user, task_id=task_id
    )
    return Message(message="Task deleted")
