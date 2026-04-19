from typing import Any

from fastapi import APIRouter

from app.modules.checklist import services as ck_service
from app.modules.iam.deps import CurrentUser
from app.shared.deps import SessionDep

router = APIRouter(prefix="/checklist", tags=["checklist"])


@router.get("/")
def get_checklist(session: SessionDep, current_user: CurrentUser) -> Any:
    tasks = ck_service.generate_tasks(
        session=session, current_user=current_user
    )
    return {"tasks": tasks, "count": len(tasks)}
