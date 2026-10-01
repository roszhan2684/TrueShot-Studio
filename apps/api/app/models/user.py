from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, ULIDPrimaryKey


class User(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "users"

    clerk_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(200))
    avatar_url: Mapped[str | None] = mapped_column(String(2048))
    workspace_id: Mapped[str | None] = mapped_column(
        String(26), ForeignKey("workspaces.id", ondelete="SET NULL"), index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    data_deletion_requested_at: Mapped[str | None] = mapped_column(String(32))

    workspace: Mapped["Workspace | None"] = relationship(
        back_populates="members", foreign_keys="[User.workspace_id]"
    )
    photoshoots: Mapped[list["PhotoshootJob"]] = relationship(back_populates="user")  # type: ignore[name-defined]
    billing_customer: Mapped["BillingCustomer | None"] = relationship(back_populates="user")  # type: ignore[name-defined]
    audit_events: Mapped[list["AuditEvent"]] = relationship(back_populates="user")  # type: ignore[name-defined]


class Workspace(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    owner_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan: Mapped[str] = mapped_column(String(32), default="free", nullable=False)

    members: Mapped[list["User"]] = relationship(
        back_populates="workspace", foreign_keys="[User.workspace_id]"
    )
    invites: Mapped[list["TeamInvite"]] = relationship(back_populates="workspace")


class TeamInvite(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "team_invites"

    workspace_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="member", nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[str] = mapped_column(String(32), nullable=False)
    accepted_at: Mapped[str | None] = mapped_column(String(32))

    workspace: Mapped["Workspace"] = relationship(back_populates="invites")
