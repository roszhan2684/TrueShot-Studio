from datetime import datetime

from pydantic import BaseModel


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    workspace_id: str | None
    stripe_subscription_id: str
    stripe_price_id: str
    plan: str
    status: str
    current_period_start: str
    current_period_end: str
    cancel_at_period_end: bool
    cancelled_at: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutSessionRequest(BaseModel):
    price_id: str
    is_annual: bool = False


class CheckoutSessionResponse(BaseModel):
    url: str


class PortalSessionResponse(BaseModel):
    url: str


class UsageSummaryResponse(BaseModel):
    plan: str
    photoshoots_used: int
    photoshoots_limit: int
    headshots_generated: int
    edit_jobs_used: int
    edit_jobs_limit: int
    period_end: str
