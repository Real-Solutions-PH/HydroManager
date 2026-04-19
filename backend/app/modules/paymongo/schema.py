from sqlmodel import Field, SQLModel

from app.modules.iam.users.schema import UserTier


class CheckoutRequest(SQLModel):
    target_tier: UserTier
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|yearly)$")


class CheckoutResponse(SQLModel):
    checkout_url: str
    amount_php: float
    billing_cycle: str
