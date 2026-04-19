from typing import Any

from fastapi import APIRouter

from app.modules.hydro_ai import services as ai_service
from app.modules.hydro_ai import vision as vision_service
from app.modules.hydro_ai.schema import (
    ChatRequest,
    ChatResponse,
    VisionOnboardRequest,
    VisionOnboardResponse,
)
from app.modules.hydro_common.quota import AI_MONTHLY_QUOTAS, get_or_create_usage
from app.modules.iam.deps import CurrentUser
from app.shared.deps import SessionDep

router = APIRouter(prefix="/hydro-ai", tags=["hydro-ai"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    *, session: SessionDep, current_user: CurrentUser, data: ChatRequest
) -> Any:
    return ai_service.chat(
        session=session, current_user=current_user, data=data
    )


@router.get("/quota")
def quota(session: SessionDep, current_user: CurrentUser) -> dict:
    usage = get_or_create_usage(session=session, user_id=current_user.id)
    limit = AI_MONTHLY_QUOTAS[current_user.tier]
    session.commit()
    return {
        "tier": current_user.tier.value,
        "used": usage.messages_used,
        "limit": limit,
        "remaining": max(limit - usage.messages_used, 0),
        "period_start": usage.period_start.isoformat(),
    }


@router.post("/vision/setup-onboard", response_model=VisionOnboardResponse)
def vision_setup_onboard(
    current_user: CurrentUser,  # noqa: ARG001
    data: VisionOnboardRequest,
) -> Any:
    return vision_service.analyze(data)
