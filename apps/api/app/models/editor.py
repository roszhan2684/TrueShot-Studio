from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, ULIDPrimaryKey


class EditJob(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "edit_jobs"

    headshot_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("generated_headshots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False, index=True)
    edit_type: Mapped[str] = mapped_column(String(64), nullable=False)
    parameters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    result_storage_key: Mapped[str | None] = mapped_column(String(512))
    result_thumbnail_key: Mapped[str | None] = mapped_column(String(512))
    celery_task_id: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[str | None] = mapped_column(String(32))
    completed_at: Mapped[str | None] = mapped_column(String(32))

    headshot: Mapped["GeneratedHeadshot"] = relationship(back_populates="edit_jobs")  # type: ignore[name-defined]
    exports: Mapped[list["ExportAsset"]] = relationship(back_populates="edit_job")  # type: ignore[name-defined]
