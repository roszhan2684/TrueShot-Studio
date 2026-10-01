import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import get_db
from app.models.export import ExportAsset
from app.models.headshot import GeneratedHeadshot
from app.models.photoshoot import PhotoshootJob
from app.schemas.export import ExportCreate, ExportResponse, VALID_EXPORT_FORMATS, EXPORT_DIMENSIONS
from app.services.audit_service import AuditService
from app.storage.s3 import generate_presigned_get
from app.core.config import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()
router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_export(
    body: ExportCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if body.format not in VALID_EXPORT_FORMATS:
        raise HTTPException(status_code=422, detail=f"Invalid export format: {body.format}")

    headshot = await _get_owned_headshot(body.headshot_id, current_user.id, db)
    dims = EXPORT_DIMENSIONS[body.format]

    asset = ExportAsset(
        headshot_id=headshot.id,
        edit_job_id=body.edit_job_id,
        user_id=current_user.id,
        format=body.format,
        status="queued",
        width_px=dims[0],
        height_px=dims[1],
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    # Enqueue export task
    from app.workers.tasks.export import run_export_job
    run_export_job.delay(asset.id)

    await AuditService(db).log(
        user_id=current_user.id,
        action="export.created",
        resource_type="export",
        resource_id=asset.id,
        metadata={"format": body.format},
    )
    return {"data": ExportResponse.model_validate(asset)}


@router.get("")
async def list_exports(
    current_user: CurrentUser,
    headshot_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_headshot(headshot_id, current_user.id, db)
    result = await db.execute(
        select(ExportAsset)
        .where(ExportAsset.headshot_id == headshot_id, ExportAsset.user_id == current_user.id)
        .order_by(ExportAsset.created_at.desc())
    )
    exports = result.scalars().all()
    return {"data": [ExportResponse.model_validate(e) for e in exports]}


@router.get("/{export_id}/download")
async def get_download_url(
    export_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExportAsset).where(
            ExportAsset.id == export_id,
            ExportAsset.user_id == current_user.id,
        )
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Export not found")
    if asset.status != "completed" or not asset.storage_key:
        raise HTTPException(status_code=409, detail="Export is not ready")

    url = generate_presigned_get(settings.s3_bucket_outputs, asset.storage_key, expiry_seconds=300)

    await AuditService(db).log(
        user_id=current_user.id,
        action="export.downloaded",
        resource_type="export",
        resource_id=export_id,
    )
    return {"data": {"url": url}}


async def _get_owned_headshot(headshot_id: str, user_id: str, db: AsyncSession) -> GeneratedHeadshot:
    result = await db.execute(
        select(GeneratedHeadshot).where(GeneratedHeadshot.id == headshot_id)
    )
    headshot = result.scalar_one_or_none()
    if not headshot:
        raise HTTPException(status_code=404, detail="Headshot not found")
    ps_result = await db.execute(
        select(PhotoshootJob).where(
            PhotoshootJob.id == headshot.photoshoot_id,
            PhotoshootJob.user_id == user_id,
        )
    )
    if not ps_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")
    return headshot
