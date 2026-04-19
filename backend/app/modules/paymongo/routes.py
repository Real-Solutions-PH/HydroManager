from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request

from app.modules.iam.deps import CurrentUser
from app.modules.paymongo import services as pm_service
from app.modules.paymongo.schema import CheckoutRequest, CheckoutResponse
from app.shared.deps import SessionDep

router = APIRouter(prefix="/paymongo", tags=["paymongo"])


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(current_user: CurrentUser, data: CheckoutRequest) -> Any:
    return pm_service.start_checkout(current_user=current_user, data=data)


@router.post("/webhook")
async def webhook(
    request: Request,
    session: SessionDep,
    paymongo_signature: str | None = Header(default=None),
) -> dict:
    raw = await request.body()
    if not pm_service.verify_webhook_signature(
        raw_body=raw, signature=paymongo_signature or ""
    ):
        raise HTTPException(status_code=401, detail="Invalid signature")
    try:
        event = (await request.json())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    pm_service.handle_event(session=session, event=event)
    return {"received": True}
