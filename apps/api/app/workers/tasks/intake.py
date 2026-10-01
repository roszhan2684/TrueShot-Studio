"""
Reference Intake Pipeline
Runs after user confirms upload set. Scores each image and builds identity profile.
Full ML implementation goes here in STEP 6 — these are clean typed stubs.
"""
import structlog
from celery import Task

from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)


class IntakeTask(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        job_id = args[0] if args else kwargs.get("job_id")
        log.error("intake_task_failed", job_id=job_id, error=str(exc))
        # Update DB status to failed — done in a sync context
        _mark_job_failed(job_id, str(exc))


@celery_app.task(bind=True, base=IntakeTask, name="app.workers.tasks.intake.run_intake_pipeline")
def run_intake_pipeline(self, job_id: str) -> dict:
    """
    1. Load reference images from S3
    2. Score each image (blur, face detection, lighting, etc.)
    3. Reject low-quality images and record reasons
    4. Build identity embedding from accepted images
    5. Update job status → queued and trigger generation
    """
    log.info("intake_pipeline_start", job_id=job_id, task_id=self.request.id)

    try:
        _set_job_status(job_id, "validating", celery_task_id=self.request.id)
        images = _load_reference_images(job_id)

        scored = []
        for image in images:
            signals = _score_image(image)
            _save_quality_signals(image["id"], signals)
            if signals["overall_score"] >= 0.35:
                scored.append({**image, "signals": signals})
            else:
                _reject_image(image["id"], "Quality score too low")

        if len(scored) < 8:
            _mark_job_failed(job_id, f"Only {len(scored)} photos passed quality check. Need at least 8.")
            return {"status": "failed", "reason": "insufficient_quality_images"}

        _build_identity_profile(job_id, scored)
        _set_job_status(job_id, "queued")

        from app.workers.tasks.generation import run_generation_pipeline
        run_generation_pipeline.delay(job_id)

        log.info("intake_pipeline_complete", job_id=job_id, accepted=len(scored))
        return {"status": "success", "accepted_count": len(scored)}

    except Exception as exc:
        log.error("intake_pipeline_error", job_id=job_id, error=str(exc))
        self.retry(exc=exc, countdown=30)


# ─── Sync DB helpers (run inside Celery worker synchronously) ──────────────

def _set_job_status(job_id: str, status: str, celery_task_id: str | None = None) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        if job:
            job.status = status
            if celery_task_id:
                job.celery_task_id = celery_task_id
            session.commit()


def _mark_job_failed(job_id: str, reason: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        if job:
            job.status = "failed"
            job.error_message = reason
            session.commit()


def _load_reference_images(job_id: str) -> list[dict]:
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import UploadedReferenceImage

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        images = session.execute(
            select(UploadedReferenceImage).where(
                UploadedReferenceImage.photoshoot_id == job_id,
                UploadedReferenceImage.is_rejected == False,  # noqa: E712
            )
        ).scalars().all()
        return [{"id": i.id, "storage_key": i.storage_key, "mime_type": i.mime_type} for i in images]


def _score_image(image: dict) -> dict:
    """
    Stub — replace with real computer vision pipeline.
    In production: download from S3, run InsightFace/MTCNN face detection,
    compute blur (Laplacian variance), lighting histogram, etc.
    """
    return {
        "face_detected": True,
        "face_centered": True,
        "blur_score": 0.85,
        "lighting_score": 0.80,
        "occlusion_score": 0.90,
        "angle": "frontal",
        "expression_label": "neutral",
        "has_glasses": False,
        "has_hat": False,
        "overall_score": 0.85,
    }


def _save_quality_signals(image_id: str, signals: dict) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import UploadedReferenceImage

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        image = session.get(UploadedReferenceImage, image_id)
        if image:
            image.quality_signals = signals
            session.commit()


def _reject_image(image_id: str, reason: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import UploadedReferenceImage

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        image = session.get(UploadedReferenceImage, image_id)
        if image:
            image.is_rejected = True
            image.rejection_reason = reason
            session.commit()


def _build_identity_profile(job_id: str, images: list[dict]) -> None:
    """
    Stub — replace with real face embedding pipeline.
    In production: aggregate InsightFace embeddings across reference images,
    compute mean embedding, store as identity profile.
    """
    import random
    mock_embedding = [random.gauss(0, 1) for _ in range(512)]

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.headshot import IdentityProfile

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        profile = IdentityProfile(
            photoshoot_id=job_id,
            embedding_vector=mock_embedding,
            embedding_version="v1-stub",
            vector_dimension=512,
        )
        session.add(profile)
        session.commit()
