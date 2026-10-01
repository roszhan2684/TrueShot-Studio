import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import get_db
from app.models.editor import EditJob
from app.models.headshot import GeneratedHeadshot
from app.models.photoshoot import PhotoshootJob
from app.schemas.editor import EditJobCreate, EditJobResponse
from app.services.audit_service import AuditService

log = structlog.get_logger(__name__)
router = APIRouter()

VALID_EDIT_TYPES = {
    "background_swap", "background_blur", "outfit_color", "outfit_style",
    "hair_cleanup", "beard_cleanup", "flyaway_removal", "skin_retouch",
    "glasses_remove", "glasses_keep", "smile_adjust", "crop_reframe",
    "relight", "blemish_cleanup", "undereye_reduction",
}


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def create_edit_job(
    body: EditJobCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if body.edit_type not in VALID_EDIT_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid edit_type: {body.edit_type}")

    headshot = await _get_owned_headshot(body.headshot_id, current_user.id, db)

    job = EditJob(
        headshot_id=headshot.id,
        user_id=current_user.id,
        status="queued",
        edit_type=body.edit_type,
        parameters=body.parameters,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Enqueue the editing worker task
    from app.workers.tasks.editing import run_edit_job
    run_edit_job.delay(job.id)

    await AuditService(db).log(
        user_id=current_user.id,
        action="edit.created",
        resource_type="edit_job",
        resource_id=job.id,
        metadata={"edit_type": body.edit_type},
    )
    return {"data": EditJobResponse.model_validate(job)}


@router.get("/jobs")
async def list_edit_jobs(
    current_user: CurrentUser,
    headshot_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_headshot(headshot_id, current_user.id, db)

    result = await db.execute(
        select(EditJob)
        .where(EditJob.headshot_id == headshot_id, EditJob.user_id == current_user.id)
        .order_by(EditJob.created_at.desc())
    )
    jobs = result.scalars().all()
    return {"data": [EditJobResponse.model_validate(j) for j in jobs]}


@router.get("/jobs/{job_id}")
async def get_edit_job(
    job_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EditJob).where(EditJob.id == job_id, EditJob.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Edit job not found")
    return {"data": EditJobResponse.model_validate(job)}


async def _get_owned_headshot(
    headshot_id: str, user_id: str, db: AsyncSession
) -> GeneratedHeadshot:
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
