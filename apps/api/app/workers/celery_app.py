from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "trueshot",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.workers.tasks.intake",
        "app.workers.tasks.generation",
        "app.workers.tasks.evaluation",
        "app.workers.tasks.editing",
        "app.workers.tasks.export",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,                # Prevent duplicate runs on worker crash
    worker_prefetch_multiplier=1,       # One task at a time per worker (image ops are heavy)
    task_routes={
        "app.workers.tasks.intake.*": {"queue": "intake"},
        "app.workers.tasks.generation.*": {"queue": "generation"},
        "app.workers.tasks.evaluation.*": {"queue": "evaluation"},
        "app.workers.tasks.editing.*": {"queue": "editing"},
        "app.workers.tasks.export.*": {"queue": "export"},
    },
    task_default_retry_delay=30,
    task_max_retries=3,
    result_expires=86400,               # 24h TTL on results
)
