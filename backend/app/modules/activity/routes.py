from typing import Any

from fastapi import APIRouter

from app.modules.activity import services as activity_service
from app.modules.activity.schema import ActivitiesPublic, ActivityPublic
from app.modules.iam.deps import CurrentUser
from app.shared.deps import SessionDep

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/", response_model=ActivitiesPublic)
def list_activity(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    rows, count = activity_service.list_activities(
        session=session, current_user=current_user, skip=skip, limit=limit
    )
    data = [ActivityPublic.model_validate(r, from_attributes=True) for r in rows]
    return ActivitiesPublic(data=data, count=count)
