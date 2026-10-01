from typing import Any

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.config import get_settings
from app.core.security import verify_internal_secret
from app.db.base import get_db
from app.models.billing import Subscription
from app.models.photoshoot import PhotoshootJob
from app.models.editor import EditJob
from app.schemas.billing import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PortalSessionResponse,
    SubscriptionResponse,
    UsageSummaryResponse,
)
from app.services.billing_service import BillingService, PLAN_LIMITS
from app.services.audit_service import AuditService

log = structlog.get_logger(__name__)
settings = get_settings()
router = APIRouter()

APP_URL = "http://localhost:3000"  # overridden by env in production


@router.get("/subscription")
async def get_subscription(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = BillingService(db)
    sub = await service.get_active_subscription(current_user.id)
    if not sub:
        return {"data": None}
    return {"data": SubscriptionResponse.model_validate(sub)}


@router.get("/usage")
async def get_usage(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = BillingService(db)
    sub = await service.get_active_subscription(current_user.id)
    plan = sub.plan if sub else "free"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])

    # Count this month's photoshoots
    ps_result = await db.execute(
        select(func.count()).select_from(PhotoshootJob).where(
            PhotoshootJob.user_id == current_user.id,
            PhotoshootJob.status.in_(["completed", "generating", "evaluating", "queued"]),
        )
    )
    photoshoots_used = ps_result.scalar() or 0

    ej_result = await db.execute(
        select(func.count()).select_from(EditJob).where(
            EditJob.user_id == current_user.id
        )
    )
    edit_jobs_used = ej_result.scalar() or 0

    return {
        "data": UsageSummaryResponse(
            plan=plan,
            photoshoots_used=photoshoots_used,
            photoshoots_limit=limits["photoshoots"],
            headshots_generated=0,
            edit_jobs_used=edit_jobs_used,
            edit_jobs_limit=limits["edit_jobs"],
            period_end=sub.current_period_end if sub else "",
        )
    }


@router.post("/checkout")
async def create_checkout_session(
    body: CheckoutSessionRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = BillingService(db)
    url = await service.create_checkout_session(
        user=current_user,
        price_id=body.price_id,
        success_url=f"{APP_URL}/billing?success=1",
        cancel_url=f"{APP_URL}/pricing",
    )
    await AuditService(db).log(
        user_id=current_user.id,
        action="billing.subscribed",
        resource_type="subscription",
        resource_id=current_user.id,
        metadata={"price_id": body.price_id},
    )
    return {"data": CheckoutSessionResponse(url=url)}


@router.post("/portal")
async def create_portal_session(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = BillingService(db)
    url = await service.create_portal_session(
        user=current_user,
        return_url=f"{APP_URL}/billing",
    )
    return {"data": PortalSessionResponse(url=url)}


@router.post("/webhook", dependencies=[Depends(verify_internal_secret)])
async def stripe_webhook(
    request: Request,
    x_stripe_event_type: str = Header(alias="X-Stripe-Event-Type"),
    db: AsyncSession = Depends(get_db),
):
    """Receives Stripe events forwarded from the Next.js webhook route."""
    event: dict[str, Any] = await request.json()
    service = BillingService(db)
    await service.handle_stripe_event(event)
    return {"received": True}
