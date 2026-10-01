from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, ULIDPrimaryKey


class GeneratedHeadshot(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "generated_headshots"

    photoshoot_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("photoshoot_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    style_pack_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_key: Mapped[str] = mapped_column(String(512), nullable=False)
    prompt: Mapped[str | None] = mapped_column(Text)
    model_id: Mapped[str | None] = mapped_column(String(128))
    quality_score: Mapped[dict | None] = mapped_column(JSON)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, index=True)
    rank: Mapped[int] = mapped_column(Integer, default=999, nullable=False)
    is_favorited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_rejected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    generated_at: Mapped[str] = mapped_column(String(32), nullable=False)

    photoshoot: Mapped["PhotoshootJob"] = relationship(back_populates="generated_headshots")  # type: ignore[name-defined]
    edit_jobs: Mapped[list["EditJob"]] = relationship(back_populates="headshot")  # type: ignore[name-defined]
    exports: Mapped[list["ExportAsset"]] = relationship(back_populates="headshot")  # type: ignore[name-defined]


class IdentityProfile(ULIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "identity_profiles"

    photoshoot_id: Mapped[str] = mapped_column(
        String(26),
        ForeignKey("photoshoot_jobs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    # Embedding stored as JSON float array — in production, migrate to pgvector
    embedding_vector: Mapped[list | None] = mapped_column(JSON)
    embedding_version: Mapped[str] = mapped_column(String(32), nullable=False, default="v1")
    vector_dimension: Mapped[int] = mapped_column(Integer, nullable=False, default=512)

    photoshoot: Mapped["PhotoshootJob"] = relationship(back_populates="identity_profile")  # type: ignore[name-defined]
