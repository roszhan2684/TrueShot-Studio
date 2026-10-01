import sentry_sdk
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)
log = structlog.get_logger(__name__)

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        traces_sample_rate=0.2 if settings.is_production else 1.0,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup (demo mode uses SQLite, no Alembic needed)
    from app.db.base import init_db
    await init_db()
    log.info("database_ready")
    yield


app = FastAPI(
    title="TrueShot Studio API",
    version="0.1.0",
    description="Identity-faithful AI headshot generation platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Demo: allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}


from app.api.v1 import router as v1_router  # noqa: E402

app.include_router(v1_router, prefix="/api/v1")
