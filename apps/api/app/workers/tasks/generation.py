"""
Generation Pipeline — synchronous demo implementation (no Celery workers needed).
Called directly via FastAPI BackgroundTasks.
"""
import struct
import zlib
import random
from datetime import datetime, timezone

import structlog

log = structlog.get_logger(__name__)

PACK_OUTPUT_COUNTS: dict[str, int] = {
    "corporate-studio": 4,
    "linkedin-modern": 4,
    "founder-casual": 4,
    "executive-dark": 4,
    "creative-pro": 4,
    "team-page": 6,
}

PACK_PROMPTS: dict[str, str] = {
    "corporate-studio": "Professional studio portrait, clean white background, sharp focus, corporate attire",
    "linkedin-modern": "Modern LinkedIn profile photo, soft neutral background, business casual, warm lighting",
    "founder-casual": "Approachable startup founder portrait, blurred office background, casual confidence",
    "executive-dark": "Executive portrait, dark dramatic background, high contrast, authoritative presence",
    "creative-pro": "Creative professional headshot, warm textured background, artistic lighting",
    "team-page": "Consistent team page portrait, brand-aligned background, unified lighting",
}

PACK_COLORS: dict[str, tuple[int, int, int]] = {
    "corporate-studio": (230, 230, 230),
    "linkedin-modern": (200, 220, 240),
    "founder-casual": (220, 200, 190),
    "executive-dark": (30, 30, 50),
    "creative-pro": (200, 180, 160),
    "team-page": (210, 210, 225),
}


def run_generation_pipeline(job_id: str) -> dict:
    """Synchronous generation — runs inline, no Celery required."""
    log.info("generation_pipeline_start", job_id=job_id)

    try:
        job = _get_job(job_id)
        if not job:
            log.error("generation_job_not_found", job_id=job_id)
            return {"status": "error", "reason": "job_not_found"}

        pack_ids: list[str] = job["style_pack_ids"] or ["corporate-studio"]
        total = sum(PACK_OUTPUT_COUNTS.get(p, 4) for p in pack_ids)

        _set_job_status(job_id, "generating", started_at=datetime.now(timezone.utc).isoformat())

        from app.core.progress import append_recent_headshot, set_progress
        set_progress(job_id, total_outputs=total, completed_outputs=0,
                     current_style="", current_step="Starting generation...",
                     started_at=datetime.now(timezone.utc).isoformat())

        completed = 0
        for pack_id in pack_ids:
            count = PACK_OUTPUT_COUNTS.get(pack_id, 4)
            for i in range(count):
                headshot_id = _create_headshot(job_id, pack_id, i)
                completed += 1
                set_progress(job_id, completed_outputs=completed,
                             current_style=pack_id,
                             current_step=f"Generated {completed}/{total}")
                append_recent_headshot(job_id, headshot_id)
                _increment_generated_count(job_id)

        set_progress(job_id, current_step="Evaluating quality...")
        _set_job_status(job_id, "evaluating")

        from app.workers.tasks.evaluation import run_evaluation_pipeline
        return run_evaluation_pipeline(job_id)

    except Exception as exc:
        log.error("generation_pipeline_error", job_id=job_id, error=str(exc))
        _mark_job_failed(job_id, str(exc))
        return {"status": "error", "reason": str(exc)}


def _create_headshot(job_id: str, pack_id: str, index: int) -> str:
    from datetime import datetime, timezone
    from app.core.config import get_settings
    from app.models.headshot import GeneratedHeadshot
    from app.models.mixins import _new_ulid

    settings = get_settings()
    headshot_id = _new_ulid()
    now = datetime.now(timezone.utc).isoformat()

    # Use path-based keys — the presigned-get endpoint derives SVG from the pack_id in the path
    storage_key = f"outputs/{job_id}/{pack_id}/{headshot_id}.png"
    thumbnail_key = f"outputs/{job_id}/{pack_id}/{headshot_id}_thumb.png"

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    db_url = settings.database_sync_url
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    with Session(engine) as session:
        headshot = GeneratedHeadshot(
            id=headshot_id,
            photoshoot_id=job_id,
            style_pack_id=pack_id,
            storage_key=storage_key,
            thumbnail_key=thumbnail_key,
            prompt=PACK_PROMPTS.get(pack_id, "Professional headshot"),
            model_id="demo-v1",
            generated_at=now,
        )
        session.add(headshot)
        session.commit()

    return headshot_id


def _placeholder_png(pack_id: str) -> bytes:
    r, g, b = PACK_COLORS.get(pack_id, (180, 180, 180))

    def chunk(name: bytes, data: bytes) -> bytes:
        body = name + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes([0, r, g, b])))
    iend = chunk(b"IEND", b"")
    return b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend


def _get_job(job_id: str) -> dict | None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    db_url = settings.database_sync_url
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        return {"style_pack_ids": job.style_pack_ids or []} if job else None


def _set_job_status(job_id: str, status: str, started_at: str | None = None) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    db_url = settings.database_sync_url
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        if job:
            job.status = status
            if started_at:
                job.started_at = started_at
            session.commit()


def _increment_generated_count(job_id: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    db_url = settings.database_sync_url
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        if job:
            job.generated_count = (job.generated_count or 0) + 1
            session.commit()


def _mark_job_failed(job_id: str, reason: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.core.config import get_settings
    from app.models.photoshoot import PhotoshootJob

    settings = get_settings()
    db_url = settings.database_sync_url
    engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    with Session(engine) as session:
        job = session.get(PhotoshootJob, job_id)
        if job:
            job.status = "failed"
            job.error_message = reason
            session.commit()
