from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, ULIDPrimaryKey


class BillingCustomer(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "billing_customers"

    user_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    stripe_customer_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)

    user: Mapped["User"] = relationship(back_populates="billing_customer")  # type: ignore[name-defined]
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="billing_customer")


class Subscription(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    billing_customer_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("billing_customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[str | None] = mapped_column(
        String(26), ForeignKey("workspaces.id", ondelete="SET NULL"), index=True
    )
    stripe_subscription_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    stripe_price_id: Mapped[str] = mapped_column(String(64), nullable=False)
    plan: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    current_period_start: Mapped[str] = mapped_column(String(32), nullable=False)
    current_period_end: Mapped[str] = mapped_column(String(32), nullable=False)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cancelled_at: Mapped[str | None] = mapped_column(String(32))

    billing_customer: Mapped["BillingCustomer"] = relationship(back_populates="subscriptions")
