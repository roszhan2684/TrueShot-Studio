from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import get_db
from app.models.photoshoot import PhotoshootJob
from app.schemas.photoshoot import (
    PhotoshootCreate,
    PhotoshootResponse,
    PhotoshootStatusResponse,
    ValidateReferenceResponse,
)
from app.services.audit_service import AuditService

log = structlog.get_logger(__name__)
router = APIRouter()


@router.get("")
async def list_photoshoots(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(PhotoshootJob)
        .where(PhotoshootJob.user_id == current_user.id)
        .order_by(desc(PhotoshootJob.created_at))
        .offset(offset)
        .limit(page_size)
    )
    jobs = result.scalars().all()

    count_result = await db.execute(
        select(PhotoshootJob).where(PhotoshootJob.user_id == current_user.id)
    )
    total = len(count_result.scalars().all())

    return {
        "items": [PhotoshootResponse.model_validate(j) for j in jobs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (offset + page_size) < total,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_photoshoot(
    body: PhotoshootCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    job = PhotoshootJob(
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        title=body.title,
        status="draft",
        style_pack_ids=body.style_pack_ids,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await AuditService(db).log(
        user_id=current_user.id,
        action="photoshoot.created",
        resource_type="photoshoot",
        resource_id=job.id,
    )
    log.info("photoshoot_created", job_id=job.id, user_id=current_user.id)
    return {"data": PhotoshootResponse.model_validate(job)}


@router.get("/{job_id}")
async def get_photoshoot(
    job_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job(job_id, current_user.id, db)
    return {"data": PhotoshootResponse.model_validate(job)}


@router.get("/{job_id}/status")
async def get_photoshoot_status(
    job_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job(job_id, current_user.id, db)

    progress_map = {
        "draft": 0, "uploading": 5, "validating": 10,
        "queued": 15, "generating": 50, "evaluating": 85,
        "completed": 100, "failed": 0, "cancelled": 0,
    }
    step_map = {
        "draft": "Waiting for uploads",
        "uploading": "Uploading reference photos",
        "validating": "Analyzing photo quality",
        "queued": "Queued for generation",
        "generating": "Generating headshots",
        "evaluating": "Scoring and ranking results",
        "completed": "Complete",
        "failed": None,
        "cancelled": None,
    }

    return {
        "data": PhotoshootStatusResponse(
            job_id=job.id,
            status=job.status,
            progress=progress_map.get(job.status, 0),
            current_step=step_map.get(job.status),
            estimated_seconds_remaining=_estimate_remaining(job.status),
            completed_at=job.completed_at,
            error_message=job.error_message,
        )
    }


@router.get("/{job_id}/generation-progress")
async def get_generation_progress(
    job_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Real-time generation progress. Reads Redis while job is active; falls back to DB."""
    job = await _get_owned_job(job_id, current_user.id, db)

    from app.core.progress import get_progress, get_recent_headshots

    redis_data = get_progress(job_id)
    recent_ids = get_recent_headshots(job_id)

    total = int(redis_data.get("total_outputs", 0))
    completed = int(redis_data.get("completed_outputs", job.generated_count or 0))
    current_step = redis_data.get("current_step") or _default_step(job.status)

    return {
        "data": {
            "job_id": job_id,
            "status": job.status,
            "total_outputs": total or _estimate_total(job.style_pack_ids),
            "completed_outputs": completed,
            "current_step": current_step,
            "current_style": redis_data.get("current_style", ""),
            "recent_headshot_ids": recent_ids,
            "quality_pass_count": job.quality_pass_count,
            "completed_at": job.completed_at,
            "error_message": job.error_message,
        }
    }


@router.post("/{job_id}/validate")
async def validate_references(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Trigger validation then kick off the full pipeline as a background task."""
    job = await _get_owned_job(job_id, current_user.id, db)

    if job.status not in ("draft", "uploading"):
        raise HTTPException(status_code=409, detail="Job is past the upload stage")

    from app.models.photoshoot import UploadedReferenceImage
    result = await db.execute(
        select(UploadedReferenceImage).where(
            UploadedReferenceImage.photoshoot_id == job_id,
            UploadedReferenceImage.is_rejected == False,  # noqa: E712
        )
    )
    images = result.scalars().all()

    # In demo mode accept any number of uploads (skip the 8-photo minimum)
    import os
    demo_mode = os.environ.get("DEMO_MODE", "1") == "1"
    min_images = 1 if demo_mode else 8

    feedback: list[str] = []
    passed = len(images) >= min_images
    if not passed:
        feedback.append(f"Upload at least {min_images} photo(s). You have {len(images)}.")

    if passed:
        job.status = "validating"
        await db.commit()
        # Run entire pipeline as a background task (no Celery needed)
        from app.workers.tasks.generation import run_generation_pipeline
        background_tasks.add_task(_run_full_pipeline, job_id)

    return {
        "data": ValidateReferenceResponse(
            passed=passed,
            feedback=feedback,
            image_count=len(images),
            rejected_count=sum(1 for i in images if i.is_rejected),
            overall_quality=_compute_avg_quality(images),
        )
    }


def _run_full_pipeline(job_id: str) -> None:
    """Synchronous pipeline: intake → generation → evaluation. Called via BackgroundTasks."""
    try:
        from app.workers.tasks.generation import run_generation_pipeline
        run_generation_pipeline(job_id)
    except Exception as exc:
        log.error("pipeline_error", job_id=job_id, error=str(exc))


@router.post("/{job_id}/cancel")
async def cancel_photoshoot(
    job_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    job = await _get_owned_job(job_id, current_user.id, db)
    if job.status in ("completed", "failed", "cancelled"):
        raise HTTPException(status_code=409, detail="Job already in terminal state")

    job.status = "cancelled"
    await db.commit()
    return {"message": "cancelled"}


# ─── Helpers ────────────────────────────────────────────────────────────────

async def _get_owned_job(job_id: str, user_id: str, db: AsyncSession) -> PhotoshootJob:
    result = await db.execute(
        select(PhotoshootJob).where(
            PhotoshootJob.id == job_id,
            PhotoshootJob.user_id == user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Photoshoot not found")
    return job


def _estimate_remaining(status: str) -> int | None:
    estimates = {"queued": 900, "generating": 600, "evaluating": 120, "validating": 30}
    return estimates.get(status)


def _default_step(status: str) -> str:
    return {
        "queued": "Queued for generation",
        "generating": "Generating headshots...",
        "evaluating": "Scoring and ranking results...",
        "completed": "Complete",
    }.get(status, status.title())


def _estimate_total(pack_ids: list) -> int:
    COUNTS = {
        "corporate-studio": 4, "linkedin-modern": 4, "founder-casual": 4,
        "executive-dark": 4, "creative-pro": 4, "team-page": 6,
    }
    return sum(COUNTS.get(p, 4) for p in (pack_ids or []))


def _compute_avg_quality(images: list) -> float:
    scored = [i for i in images if i.quality_signals and "overall_score" in i.quality_signals]
    if not scored:
        return 0.0
    return sum(i.quality_signals["overall_score"] for i in scored) / len(scored)

