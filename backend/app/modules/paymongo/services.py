"""PayMongo integration skeleton. Replace stubs with live API calls when keys provided."""

import base64
import hashlib
import hmac
import os
import uuid
from typing import Any

import httpx
from fastapi import HTTPException
from sqlmodel import Session

from app.modules.iam.users.models import User
from app.modules.iam.users.schema import UserTier
from app.modules.paymongo.schema import CheckoutRequest, CheckoutResponse

PAYMONGO_SECRET = os.getenv("PAYMONGO_SECRET_KEY", "")
PAYMONGO_WEBHOOK_SECRET = os.getenv("PAYMONGO_WEBHOOK_SECRET", "")
PAYMONGO_BASE = "https://api.paymongo.com/v1"

TIER_PRICE_PHP: dict[UserTier, dict[str, float]] = {
    UserTier.free: {"monthly": 0, "yearly": 0},
    UserTier.grower: {"monthly": 199, "yearly": 199 * 12 * 0.85},
    UserTier.pro: {"monthly": 299, "yearly": 299 * 12 * 0.85},
}


def start_checkout(
    *, current_user: User, data: CheckoutRequest
) -> CheckoutResponse:
    if data.target_tier == UserTier.free:
        raise HTTPException(status_code=400, detail="Free tier is default; no checkout.")
    amount = TIER_PRICE_PHP[data.target_tier][data.billing_cycle]
    if not PAYMONGO_SECRET:
        return CheckoutResponse(
            checkout_url=(
                f"https://sandbox.paymongo.local/checkout?"
                f"user={current_user.id}&tier={data.target_tier.value}"
                f"&cycle={data.billing_cycle}"
            ),
            amount_php=amount,
            billing_cycle=data.billing_cycle,
        )
    token = base64.b64encode(f"{PAYMONGO_SECRET}:".encode()).decode()
    payload = {
        "data": {
            "attributes": {
                "line_items": [
                    {
                        "currency": "PHP",
                        "amount": int(amount * 100),
                        "name": f"HydroManager {data.target_tier.value.title()}",
                        "quantity": 1,
                    }
                ],
                "payment_method_types": ["gcash", "paymaya", "card"],
                "reference_number": str(uuid.uuid4()),
                "send_email_receipt": True,
                "description": f"HydroManager subscription ({data.billing_cycle})",
                "metadata": {
                    "user_id": str(current_user.id),
                    "tier": data.target_tier.value,
                    "cycle": data.billing_cycle,
                },
            }
        }
    }
    try:
        resp = httpx.post(
            f"{PAYMONGO_BASE}/checkout_sessions",
            json=payload,
            headers={
                "Authorization": f"Basic {token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"PayMongo error: {e}")
    body = resp.json()
    url = (
        body.get("data", {})
        .get("attributes", {})
        .get("checkout_url")
    )
    return CheckoutResponse(
        checkout_url=url or "",
        amount_php=amount,
        billing_cycle=data.billing_cycle,
    )


def verify_webhook_signature(*, raw_body: bytes, signature: str) -> bool:
    if not PAYMONGO_WEBHOOK_SECRET:
        return True
    try:
        parts = {
            kv.split("=", 1)[0]: kv.split("=", 1)[1]
            for kv in signature.split(",")
            if "=" in kv
        }
        timestamp = parts.get("t", "")
        te = parts.get("te") or parts.get("li", "")
        payload = f"{timestamp}.{raw_body.decode()}".encode()
        digest = hmac.new(
            PAYMONGO_WEBHOOK_SECRET.encode(), payload, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(digest, te)
    except Exception:
        return False


def handle_event(*, session: Session, event: dict[str, Any]) -> None:
    etype = event.get("data", {}).get("attributes", {}).get("type", "")
    attrs = (
        event.get("data", {})
        .get("attributes", {})
        .get("data", {})
        .get("attributes", {})
    )
    md = attrs.get("metadata") or {}
    user_id = md.get("user_id")
    tier = md.get("tier")
    if not user_id or not tier:
        return
    if etype in (
        "checkout_session.payment.paid",
        "payment.paid",
        "subscription.renewed",
    ):
        try:
            user = session.get(User, uuid.UUID(user_id))
        except Exception:
            return
        if user is None:
            return
        try:
            user.tier = UserTier(tier)
        except ValueError:
            return
        session.add(user)
        session.commit()
