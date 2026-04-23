from typing import Literal

from sqlmodel import SQLModel

from app.modules.iam.users.schema import UserTier


class CheckoutRequest(SQLModel):
    target_tier: UserTier
    billing_cycle: Literal["monthly", "yearly"] = "monthly"


class CheckoutResponse(SQLModel):
    checkout_url: str
    amount_php: float
    billing_cycle: str
