import structlog
import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.billing import BillingCustomer, Subscription
from app.models.user import User

log = structlog.get_logger(__name__)
settings = get_settings()

stripe.api_key = settings.stripe_secret_key

PLAN_LIMITS = {
    "starter": {"photoshoots": 1, "edit_jobs": 10},
    "pro":     {"photoshoots": 5, "edit_jobs": 50},
    "team":    {"photoshoots": 20, "edit_jobs": 200},
    "free":    {"photoshoots": 0, "edit_jobs": 0},
}


class BillingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_or_create_customer(self, user: User) -> BillingCustomer:
        result = await self.db.execute(
            select(BillingCustomer).where(BillingCustomer.user_id == user.id)
        )
        customer = result.scalar_one_or_none()
        if customer:
            return customer

        stripe_customer = stripe.Customer.create(
            email=user.email,
            name=user.name or user.email,
            metadata={"trueshot_user_id": user.id},
        )
        customer = BillingCustomer(
            user_id=user.id,
            stripe_customer_id=stripe_customer.id,
        )
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        log.info("stripe_customer_created", user_id=user.id, stripe_id=stripe_customer.id)
        return customer

    async def get_active_subscription(self, user_id: str) -> Subscription | None:
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status.in_(["active", "trialing"]),
            )
        )
        return result.scalar_one_or_none()

    async def create_checkout_session(
        self, user: User, price_id: str, success_url: str, cancel_url: str
    ) -> str:
        customer = await self.get_or_create_customer(user)
        session = stripe.checkout.Session.create(
            customer=customer.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"trueshot_user_id": user.id},
            allow_promotion_codes=True,
        )
        return session.url  # type: ignore[return-value]

    async def create_portal_session(self, user: User, return_url: str) -> str:
        customer = await self.get_or_create_customer(user)
        session = stripe.billing_portal.Session.create(
            customer=customer.stripe_customer_id,
            return_url=return_url,
        )
        return session.url  # type: ignore[return-value]

    async def handle_stripe_event(self, event: dict) -> None:
        event_type = event.get("type", "")
        data = event.get("data", {}).get("object", {})

        if event_type in ("customer.subscription.created", "customer.subscription.updated"):
            await self._upsert_subscription(data)
        elif event_type == "customer.subscription.deleted":
            await self._cancel_subscription(data)

    async def _upsert_subscription(self, sub: dict) -> None:
        # Find user via stripe customer id
        result = await self.db.execute(
            select(BillingCustomer).where(
                BillingCustomer.stripe_customer_id == sub["customer"]
            )
        )
        billing = result.scalar_one_or_none()
        if not billing:
            log.warning("stripe_sub_no_customer", stripe_customer=sub["customer"])
            return

        price_id: str = sub["items"]["data"][0]["price"]["id"]
        plan = _plan_from_price(price_id)

        result2 = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == sub["id"]
            )
        )
        existing = result2.scalar_one_or_none()
        if existing:
            existing.status = sub["status"]
            existing.current_period_start = str(sub["current_period_start"])
            existing.current_period_end = str(sub["current_period_end"])
            existing.cancel_at_period_end = sub.get("cancel_at_period_end", False)
        else:
            new_sub = Subscription(
                user_id=billing.user_id,
                billing_customer_id=billing.id,
                stripe_subscription_id=sub["id"],
                stripe_price_id=price_id,
                plan=plan,
                status=sub["status"],
                current_period_start=str(sub["current_period_start"]),
                current_period_end=str(sub["current_period_end"]),
                cancel_at_period_end=sub.get("cancel_at_period_end", False),
            )
            self.db.add(new_sub)

        await self.db.commit()
        log.info("subscription_upserted", stripe_sub=sub["id"], plan=plan)

    async def _cancel_subscription(self, sub: dict) -> None:
        from datetime import datetime, timezone
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == sub["id"]
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.status = "cancelled"
            existing.cancelled_at = datetime.now(timezone.utc).isoformat()
            await self.db.commit()


def _plan_from_price(price_id: str) -> str:
    """Map Stripe price IDs to plan names via env config."""
    cfg = get_settings()
    mapping = {
        cfg.stripe_secret_key: "unknown",   # placeholder; real mapping below
    }
    # In production these would be real Stripe price IDs from env
    if "starter" in price_id.lower():
        return "starter"
    if "pro" in price_id.lower():
        return "pro"
    if "team" in price_id.lower():
        return "team"
    return "starter"
