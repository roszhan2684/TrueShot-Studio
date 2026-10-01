from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, ULIDPrimaryKey


class PhotoshootJob(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "photoshoot_jobs"

    user_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[str | None] = mapped_column(
        String(26), ForeignKey("workspaces.id", ondelete="SET NULL"), index=True
    )
    title: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    style_pack_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    reference_image_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    generated_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quality_pass_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    celery_task_id: Mapped[str | None] = mapped_column(String(64))
    started_at: Mapped[str | None] = mapped_column(String(32))
    completed_at: Mapped[str | None] = mapped_column(String(32))

    user: Mapped["User"] = relationship(back_populates="photoshoots")  # type: ignore[name-defined]
    reference_images: Mapped[list["UploadedReferenceImage"]] = relationship(
        back_populates="photoshoot", cascade="all, delete-orphan"
    )
    generated_headshots: Mapped[list["GeneratedHeadshot"]] = relationship(  # type: ignore[name-defined]
        back_populates="photoshoot", cascade="all, delete-orphan"
    )
    identity_profile: Mapped["IdentityProfile | None"] = relationship(  # type: ignore[name-defined]
        back_populates="photoshoot", cascade="all, delete-orphan", uselist=False
    )


class UploadedReferenceImage(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "uploaded_reference_images"

    photoshoot_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("photoshoot_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    quality_signals: Mapped[dict | None] = mapped_column(JSON)
    is_rejected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(String(200))
    uploaded_at: Mapped[str] = mapped_column(String(32), nullable=False)

    photoshoot: Mapped["PhotoshootJob"] = relationship(back_populates="reference_images")
