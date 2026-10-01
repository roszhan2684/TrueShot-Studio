from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, ULIDPrimaryKey


class ExportAsset(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "export_assets"

    headshot_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("generated_headshots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    edit_job_id: Mapped[str | None] = mapped_column(
        String(26), ForeignKey("edit_jobs.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    format: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False, index=True)
    storage_key: Mapped[str | None] = mapped_column(String(512))
    file_size: Mapped[int | None] = mapped_column(Integer)
    width_px: Mapped[int] = mapped_column(Integer, nullable=False)
    height_px: Mapped[int] = mapped_column(Integer, nullable=False)
    expires_at: Mapped[str | None] = mapped_column(String(32))

    headshot: Mapped["GeneratedHeadshot"] = relationship(back_populates="exports")  # type: ignore[name-defined]
    edit_job: Mapped["EditJob | None"] = relationship(back_populates="exports")  # type: ignore[name-defined]
