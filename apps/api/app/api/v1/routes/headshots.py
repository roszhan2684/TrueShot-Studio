import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import get_db
from app.models.headshot import GeneratedHeadshot
from app.models.photoshoot import PhotoshootJob
from app.schemas.headshot import HeadshotFavoriteRequest, HeadshotResponse
from app.services.audit_service import AuditService
from app.services.headshot_service import HeadshotService

log = structlog.get_logger(__name__)
router = APIRouter()


@router.get("")
async def list_headshots(
    current_user: CurrentUser,
    photoshoot_id: str = Query(...),
    style_pack_id: str | None = Query(default=None),
    include_rejected: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
):
    await _assert_owns_photoshoot(photoshoot_id, current_user.id, db)
    service = HeadshotService(db)
    headshots = await service.list_for_photoshoot(
        photoshoot_id, include_rejected=include_rejected, style_pack_id=style_pack_id
    )
    return {
        "items": [HeadshotResponse.model_validate(h) for h in headshots],
        "total": len(headshots),
        "page": 1,
        "page_size": len(headshots),
        "has_more": False,
    }


@router.get("/url")
async def get_image_url(
    current_user: CurrentUser,
    key: str = Query(...),
):
    # data: URLs (demo SVG placeholders) pass straight through
    if key.startswith("data:"):
        return {"data": {"url": key}}
    from app.storage.s3 import generate_presigned_get
    from app.core.config import get_settings
    bucket = get_settings().s3_bucket_outputs
    url = generate_presigned_get(bucket, key)
    return {"data": {"url": url}}


@router.get("/{headshot_id}")
async def get_headshot(
    headshot_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    headshot = await _get_owned_headshot(headshot_id, current_user.id, db)
    return {"data": HeadshotResponse.model_validate(headshot)}


@router.patch("/{headshot_id}/favorite")
async def favorite_headshot(
    headshot_id: str,
    body: HeadshotFavoriteRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    headshot = await _get_owned_headshot(headshot_id, current_user.id, db)
    service = HeadshotService(db)
    updated = await service.set_favorited(headshot, body.is_favorited)

    await AuditService(db).log(
        user_id=current_user.id,
        action="headshot.favorited",
        resource_type="headshot",
        resource_id=headshot_id,
        metadata={"is_favorited": body.is_favorited},
    )
    return {"data": HeadshotResponse.model_validate(updated)}


@router.delete("/{headshot_id}")
async def delete_headshot(
    headshot_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    headshot = await _get_owned_headshot(headshot_id, current_user.id, db)
    service = HeadshotService(db)
    await service.soft_delete(headshot)

    await AuditService(db).log(
        user_id=current_user.id,
        action="headshot.deleted",
        resource_type="headshot",
        resource_id=headshot_id,
    )
    return {"message": "deleted"}


# ─── Helpers ────────────────────────────────────────────────────────────────

async def _assert_owns_photoshoot(photoshoot_id: str, user_id: str, db: AsyncSession) -> None:
    result = await db.execute(
        select(PhotoshootJob).where(
            PhotoshootJob.id == photoshoot_id,
            PhotoshootJob.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Photoshoot not found")


async def _get_owned_headshot(
    headshot_id: str, user_id: str, db: AsyncSession
) -> GeneratedHeadshot:
    result = await db.execute(
        select(GeneratedHeadshot).where(GeneratedHeadshot.id == headshot_id)
    )
    headshot = result.scalar_one_or_none()
    if not headshot:
        raise HTTPException(status_code=404, detail="Headshot not found")

    # Verify ownership via the parent photoshoot
    ps_result = await db.execute(
        select(PhotoshootJob).where(
            PhotoshootJob.id == headshot.photoshoot_id,
            PhotoshootJob.user_id == user_id,
        )
    )
    if not ps_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    return headshot
