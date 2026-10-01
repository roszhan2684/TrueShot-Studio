import uuid
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.config import get_settings
from app.db.base import get_db
from app.models.photoshoot import PhotoshootJob, UploadedReferenceImage
from app.schemas.photoshoot import (
    PresignedUploadRequest,
    PresignedUploadResponse,
    ReferenceImageResponse,
    UploadConfirmRequest,
)
from app.storage.s3 import delete_object, generate_presigned_get, generate_presigned_upload

log = structlog.get_logger(__name__)
settings = get_settings()
router = APIRouter()

ACCEPTED_MIMES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/presign")
async def get_presigned_upload_url(
    body: PresignedUploadRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _assert_job_owned_and_open(body.photoshoot_id, current_user.id, db)

    if body.mime_type not in ACCEPTED_MIMES:
        raise HTTPException(status_code=422, detail="Unsupported file type")

    ext = body.mime_type.split("/")[1].replace("jpeg", "jpg")
    storage_key = f"uploads/{current_user.id}/{body.photoshoot_id}/{uuid.uuid4()}.{ext}"

    presign = generate_presigned_upload(
        bucket=settings.s3_bucket_uploads,
        key=storage_key,
        mime_type=body.mime_type,
        expiry_seconds=settings.presigned_url_expiry_seconds,
    )

    return {
        "data": PresignedUploadResponse(
            upload_url=presign["upload_url"],
            storage_key=storage_key,
            fields=presign["fields"],
            expires_at=presign["expires_at"],
        )
    }


@router.post("/confirm", status_code=status.HTTP_201_CREATED)
async def confirm_upload(
    body: UploadConfirmRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    job = await _assert_job_owned_and_open(body.photoshoot_id, current_user.id, db)

    result = await db.execute(
        select(UploadedReferenceImage).where(
            UploadedReferenceImage.photoshoot_id == body.photoshoot_id
        )
    )
    existing = result.scalars().all()
    if len(existing) >= settings.max_reference_images:
        raise HTTPException(status_code=409, detail=f"Maximum {settings.max_reference_images} photos per shoot")

    image = UploadedReferenceImage(
        photoshoot_id=body.photoshoot_id,
        storage_key=body.storage_key,
        file_name=body.file_name,
        file_size=body.file_size,
        mime_type=body.mime_type,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(image)
    job.reference_image_count = len(existing) + 1
    job.status = "uploading"
    await db.commit()
    await db.refresh(image)

    return {"data": ReferenceImageResponse.model_validate(image)}


@router.get("")
async def list_uploads(
    photoshoot_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _assert_job_owned_and_open(photoshoot_id, current_user.id, db)
    result = await db.execute(
        select(UploadedReferenceImage).where(
            UploadedReferenceImage.photoshoot_id == photoshoot_id
        )
    )
    images = result.scalars().all()
    return {"data": [ReferenceImageResponse.model_validate(i) for i in images]}


@router.delete("/{upload_id}")
async def delete_upload(
    upload_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UploadedReferenceImage).where(UploadedReferenceImage.id == upload_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Upload not found")

    await _assert_job_owned_and_open(image.photoshoot_id, current_user.id, db)

    delete_object(settings.s3_bucket_uploads, image.storage_key)
    await db.delete(image)
    await db.commit()
    return {"message": "deleted"}


@router.get("/url")
async def get_image_url(key: str, current_user: CurrentUser):
    # Demo mode: data URLs pass through; path-based keys resolve to SVG placeholders
    if key.startswith("data:"):
        return {"data": {"url": key}}
    if not key.startswith(f"uploads/{current_user.id}/") and \
       not key.startswith("outputs/"):
        raise HTTPException(status_code=403, detail="Access denied")

    bucket = settings.s3_bucket_uploads if key.startswith("uploads/") else settings.s3_bucket_outputs
    url = generate_presigned_get(bucket, key)
    return {"data": {"url": url}}


@router.post("/demo-upload")
async def demo_upload():
    """Accepts any file upload and discards bytes — metadata is confirmed separately."""
    return {"message": "ok"}


async def _assert_job_owned_and_open(
    photoshoot_id: str, user_id: str, db: AsyncSession
) -> PhotoshootJob:
    result = await db.execute(
        select(PhotoshootJob).where(
            PhotoshootJob.id == photoshoot_id,
            PhotoshootJob.user_id == user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Photoshoot not found")
    if job.status not in ("draft", "uploading", "validating"):
        raise HTTPException(status_code=409, detail="Photoshoot is past the upload stage")
    return job
