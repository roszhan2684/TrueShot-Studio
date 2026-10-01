"""
Export Worker — converts a headshot to a specific format and stores the result.
"""
import io
import time
from datetime import datetime, timezone

import structlog
from celery import Task

from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)

# Dimensions (w, h) per export format
FORMAT_DIMENSIONS: dict[str, tuple[int, int]] = {
    "linkedin_square": (400, 400),
    "linkedin_banner": (1584, 396),
    "resume_2x3": (600, 900),
    "cv_passport": (300, 400),
    "print_4x5": (1200, 1500),
    "print_8x10": (2400, 3000),
    "web_optimized": (800, 1000),
    "raw_full": (2048, 2560),
}


class ExportTask(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        export_id = args[0] if args else kwargs.get("export_id")
        log.error("export_task_failed", export_id=export_id, error=str(exc))
        _set_status(export_id, "failed", error=str(exc))


@celery_app.task(
    bind=True,
    base=ExportTask,
    name="app.workers.tasks.export.run_export_job",
)
def run_export_job(self, export_id: str) -> dict:
    log.info("export_job_start", export_id=export_id, task_id=self.request.id)

    try:
        asset = _get_asset(export_id)
        if not asset:
            return {"status": "error", "reason": "asset_not_found"}

        _set_status(export_id, "processing")

        # Simulate format conversion time
        time.sleep(1.5)

        result_key, file_size = _process_export(export_id, asset)

        _finalize_asset(export_id, result_key, file_size)

        log.info("export_job_complete", export_id=export_id, format=asset["format"])
        return {"status": "success", "key": result_key, "size": file_size}

    except Exception as exc:
        log.error("export_job_error", export_id=export_id, error=str(exc))
        raise self.retry(exc=exc, countdown=30)


def _process_export(export_id: str, asset: dict) -> tuple[str, int]:
    """
    Mock implementation — copies the source image to a new key.
    In production: download source, resize with Pillow, convert colour profile,
    apply format-specific post-processing, upload result.
    """
    import boto3
    from botocore.config import Config
    from app.core.config import get_settings

    settings = get_settings()
    fmt = asset["format"]
    source_key = asset["source_key"]
    result_key = f"exports/{export_id}/{fmt}.png"

    s3_kwargs = {
        "aws_access_key_id": settings.aws_access_key_id,
        "aws_secret_access_key": settings.aws_secret_access_key,
        "region_name": settings.aws_region,
        "config": Config(signature_version="s3v4"),
    }
    if settings.s3_endpoint_url:
        s3_kwargs["endpoint_url"] = settings.s3_endpoint_url

    s3 = boto3.client("s3", **s3_kwargs)
    bucket = settings.s3_bucket_outputs
    file_size = 0

    try:
        s3.copy_object(
            Bucket=bucket,
            CopySource={"Bucket": bucket, "Key": source_key},
            Key=result_key,
        )
        head = s3.head_object(Bucket=bucket, Key=result_key)
        file_size = head.get("ContentLength", 0)
    except Exception as exc:
        log.warning("export_s3_copy_failed", error=str(exc))

    return result_key, file_size


# ─── Sync DB helpers ─────────────────────────────────────────────────────────


def _get_asset(export_id: str) -> dict | None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.export import ExportAsset
    from app.models.headshot import GeneratedHeadshot
    from app.models.editor import EditJob

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        asset = session.get(ExportAsset, export_id)
        if not asset:
            return None

        source_key: str = ""
        if asset.edit_job_id:
            edit_job = session.get(EditJob, asset.edit_job_id)
            if edit_job and edit_job.result_storage_key:
                source_key = edit_job.result_storage_key
        if not source_key:
            headshot = session.get(GeneratedHeadshot, asset.headshot_id)
            if headshot:
                source_key = headshot.storage_key

        return {"format": asset.format, "source_key": source_key}


def _set_status(export_id: str, status: str, error: str | None = None) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.export import ExportAsset

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        asset = session.get(ExportAsset, export_id)
        if asset:
            asset.status = status
            if error:
                pass  # ExportAsset has no error_message — log only
            session.commit()


def _finalize_asset(export_id: str, result_key: str, file_size: int) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.export import ExportAsset

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        asset = session.get(ExportAsset, export_id)
        if asset:
            asset.status = "completed"
            asset.storage_key = result_key
            asset.file_size = file_size
            session.commit()
