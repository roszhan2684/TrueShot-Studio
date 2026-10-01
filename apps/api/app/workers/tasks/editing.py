"""
Edit Job Worker — applies targeted edits to existing headshot outputs.
"""
import time
from datetime import datetime, timezone

import structlog
from celery import Task

from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)

# Simulated processing times per edit type (seconds)
EDIT_TIMES: dict[str, float] = {
    "background_swap": 4.0,
    "background_blur": 2.5,
    "outfit_color": 5.0,
    "outfit_style": 6.0,
    "hair_cleanup": 3.0,
    "beard_cleanup": 3.0,
    "flyaway_removal": 2.5,
    "skin_retouch": 3.5,
    "glasses_remove": 5.0,
    "glasses_keep": 2.0,
    "smile_adjust": 4.0,
    "crop_reframe": 1.5,
    "relight": 4.5,
    "blemish_cleanup": 2.0,
    "undereye_reduction": 2.0,
}


class EditTask(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        job_id = args[0] if args else kwargs.get("job_id")
        log.error("edit_task_failed", job_id=job_id, error=str(exc))
        _set_status(job_id, "failed", error=str(exc))


@celery_app.task(
    bind=True,
    base=EditTask,
    name="app.workers.tasks.editing.run_edit_job",
)
def run_edit_job(self, job_id: str) -> dict:
    log.info("edit_job_start", job_id=job_id, task_id=self.request.id)

    try:
        job_data = _get_job(job_id)
        if not job_data:
            return {"status": "error", "reason": "job_not_found"}

        _set_status(job_id, "processing", started_at=datetime.now(timezone.utc).isoformat())

        # Simulate processing time
        edit_time = EDIT_TIMES.get(job_data["edit_type"], 3.0)
        time.sleep(edit_time)

        # Copy source headshot keys as result (mock — real impl would apply PIL/diffusion edits)
        result_key = job_data["source_key"].replace("/outputs/", "/outputs/edited/")
        thumb_key = job_data["source_thumb_key"].replace("/outputs/", "/outputs/edited/")

        # In production: download source, apply transformations, upload result
        _copy_source_as_result(job_id, result_key, thumb_key, job_data)

        log.info("edit_job_complete", job_id=job_id, edit_type=job_data["edit_type"])
        return {"status": "success", "result_key": result_key}

    except Exception as exc:
        log.error("edit_job_error", job_id=job_id, error=str(exc))
        raise self.retry(exc=exc, countdown=30)


# ─── Sync DB helpers ─────────────────────────────────────────────────────────


def _get_job(job_id: str) -> dict | None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.editor import EditJob
    from app.models.headshot import GeneratedHeadshot

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        job = session.get(EditJob, job_id)
        if not job:
            return None
        headshot = session.get(GeneratedHeadshot, job.headshot_id)
        return {
            "edit_type": job.edit_type,
            "parameters": job.parameters,
            "source_key": headshot.storage_key if headshot else "",
            "source_thumb_key": headshot.thumbnail_key if headshot else "",
        }


def _copy_source_as_result(job_id: str, result_key: str, thumb_key: str, job_data: dict) -> None:
    import boto3
    from botocore.config import Config

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.editor import EditJob

    settings = get_settings()

    s3_kwargs = {
        "aws_access_key_id": settings.aws_access_key_id,
        "aws_secret_access_key": settings.aws_secret_access_key,
        "region_name": settings.aws_region,
        "config": Config(signature_version="s3v4"),
    }
    if settings.s3_endpoint_url:
        s3_kwargs["endpoint_url"] = settings.s3_endpoint_url

    try:
        s3 = boto3.client("s3", **s3_kwargs)
        bucket = settings.s3_bucket_outputs
        # Copy source object as the edited result (mock)
        s3.copy_object(
            Bucket=bucket,
            CopySource={"Bucket": bucket, "Key": job_data["source_key"]},
            Key=result_key,
        )
        s3.copy_object(
            Bucket=bucket,
            CopySource={"Bucket": bucket, "Key": job_data["source_thumb_key"]},
            Key=thumb_key,
        )
    except Exception as exc:
        log.warning("edit_s3_copy_failed", error=str(exc))

    engine = create_engine(settings.database_sync_url)
    now = datetime.now(timezone.utc).isoformat()
    with Session(engine) as session:
        job = session.get(EditJob, job_id)
        if job:
            job.status = "completed"
            job.result_storage_key = result_key
            job.result_thumbnail_key = thumb_key
            job.completed_at = now
            session.commit()


def _set_status(
    job_id: str,
    status: str,
    error: str | None = None,
    started_at: str | None = None,
) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.editor import EditJob

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        job = session.get(EditJob, job_id)
        if job:
            job.status = status
            if error:
                job.error_message = error
            if started_at:
                job.started_at = started_at
            session.commit()
