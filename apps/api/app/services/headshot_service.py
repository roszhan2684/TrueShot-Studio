from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.headshot import GeneratedHeadshot
from app.storage.s3 import generate_presigned_get
from app.core.config import get_settings

settings = get_settings()


class HeadshotService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_for_photoshoot(
        self,
        photoshoot_id: str,
        include_rejected: bool = False,
        style_pack_id: str | None = None,
    ) -> list[GeneratedHeadshot]:
        stmt = (
            select(GeneratedHeadshot)
            .where(GeneratedHeadshot.photoshoot_id == photoshoot_id)
            .order_by(GeneratedHeadshot.rank.asc())
        )
        if not include_rejected:
            stmt = stmt.where(GeneratedHeadshot.is_rejected == False)  # noqa: E712
        if style_pack_id:
            stmt = stmt.where(GeneratedHeadshot.style_pack_id == style_pack_id)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, headshot_id: str) -> GeneratedHeadshot | None:
        result = await self.db.execute(
            select(GeneratedHeadshot).where(GeneratedHeadshot.id == headshot_id)
        )
        return result.scalar_one_or_none()

    async def set_favorited(self, headshot: GeneratedHeadshot, is_favorited: bool) -> GeneratedHeadshot:
        headshot.is_favorited = is_favorited
        await self.db.commit()
        await self.db.refresh(headshot)
        return headshot

    async def soft_delete(self, headshot: GeneratedHeadshot) -> None:
        headshot.is_rejected = True
        await self.db.commit()

    def get_presigned_url(self, storage_key: str) -> str:
        bucket = (
            settings.s3_bucket_uploads
            if storage_key.startswith("uploads/")
            else settings.s3_bucket_outputs
        )
        return generate_presigned_get(bucket, storage_key)
