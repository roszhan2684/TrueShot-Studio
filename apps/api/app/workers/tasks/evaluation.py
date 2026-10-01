"""
Quality Evaluation Pipeline — scores and ranks all generated headshots.
"""
import random
from datetime import datetime, timezone

import structlog
from celery import Task

from app.workers.celery_app import celery_app

log = structlog.get_logger(__name__)

# Weighted quality dimensions
SCORE_WEIGHTS: dict[str, float] = {
    "identity_similarity": 0.30,
    "face_quality": 0.20,
    "sharpness": 0.15,
    "natural_eyes": 0.10,
    "skin_texture": 0.10,
    "symmetry": 0.05,
    "background_artifacts": 0.05,
    "composition": 0.05,
}

QUALITY_GATE = 0.45  # Reject outputs below this score


class EvaluationTask(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        job_id = args[0] if args else kwargs.get("job_id")
        log.error("evaluation_task_failed", job_id=job_id, error=str(exc))
        _mark_job_failed(job_id, str(exc))


@celery_app.task(
    bind=True,
    base=EvaluationTask,
    name="app.workers.tasks.evaluation.run_evaluation_pipeline",
)
def run_evaluation_pipeline(self, job_id: str) -> dict:
    log.info("evaluation_pipeline_start", job_id=job_id)

    try:
        headshots = _load_headshots(job_id)
        if not headshots:
            _mark_job_failed(job_id, "No generated headshots found to evaluate")
            return {"status": "failed", "reason": "no_headshots"}

        passed: list[dict] = []
        for h in headshots:
            scores = _score_headshot()
            overall = _weighted_score(scores)
            _save_quality_score(h["id"], scores, overall)
            if overall >= QUALITY_GATE:
                passed.append({"id": h["id"], "overall": overall})

        # Rank accepted headshots by overall score descending
        passed.sort(key=lambda x: x["overall"], reverse=True)
        for rank, item in enumerate(passed, start=1):
            _set_rank(item["id"], rank)

        # Soft-reject outputs below the quality gate
        passed_ids = {h["id"] for h in passed}
        for h in headshots:
            if h["id"] not in passed_ids:
                _reject_headshot(h["id"])

        _finalize_job(job_id, quality_pass_count=len(passed))

        log.info(
            "evaluation_pipeline_complete",
            job_id=job_id,
            passed=len(passed),
            total=len(headshots),
        )
        return {"status": "success", "passed": len(passed), "total": len(headshots)}

    except Exception as exc:
        log.error("evaluation_pipeline_error", job_id=job_id, error=str(exc))
        raise self.retry(exc=exc, countdown=30)


# ─── Scoring ──────────────────────────────────────────────────────────────────


def _score_headshot() -> dict:
    """
    Mock scorer — in production: download from S3, run InsightFace cosine similarity
    against the identity embedding, BRISQUE sharpness, MTCNN eye quality, etc.
    """
    base = max(0.3, min(0.98, random.gauss(0.78, 0.10)))
    return {
        dim: round(min(1.0, max(0.0, base + random.gauss(0, 0.06))), 4)
        for dim in SCORE_WEIGHTS
    }


def _weighted_score(scores: dict) -> float:
    return round(sum(scores[k] * w for k, w in SCORE_WEIGHTS.items()), 4)


# ─── Sync DB helpers ─────────────────────────────────────────────────────────


def _load_headshots(job_id: str) -> list[dict]:
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.headshot import GeneratedHeadshot

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        rows = session.execute(
            select(GeneratedHeadshot).where(GeneratedHeadshot.photoshoot_id == job_id)
        ).scalars().all()
        return [{"id": h.id} for h in rows]


def _save_quality_score(headshot_id: str, scores: dict, overall: float) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.headshot import GeneratedHeadshot

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        h = session.get(GeneratedHeadshot, headshot_id)
        if h:
            h.quality_score = scores
            h.overall_score = overall
            session.commit()


def _set_rank(headshot_id: str, rank: int) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.headshot import GeneratedHeadshot

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        h = session.get(GeneratedHeadshot, headshot_id)
        if h:
            h.rank = rank
            session.commit()


def _reject_headshot(headshot_id: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.headshot import GeneratedHeadshot

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        h = session.get(GeneratedHeadshot, headshot_id)
        if h:
            h.is_rejected = True
            h.rank = 999
            session.commit()


def _finalize_job(job_id: str, quality_pass_count: int) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    engine = create_engine(settings.database_sync_url)
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        if job:
            job.status = "completed"
            job.quality_pass_count = quality_pass_count
            job.completed_at = datetime.now(timezone.utc).isoformat()
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
