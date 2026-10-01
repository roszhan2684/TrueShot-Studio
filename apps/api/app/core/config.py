from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: Literal["development", "staging", "production"] = "development"
    app_secret_key: str = "change_me"
    debug: bool = False
    log_level: str = "INFO"
    allowed_origins: str = "http://localhost:3000"

    # Database — defaults to SQLite in demo mode
    database_url: str = "sqlite+aiosqlite:////tmp/trueshot_demo.db"
    database_sync_url: str = "sqlite:////tmp/trueshot_demo.db"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Storage
    aws_access_key_id: str = "minioadmin"
    aws_secret_access_key: str = "minioadmin"
    aws_region: str = "us-east-1"
    s3_bucket_uploads: str = "trueshot-uploads"
    s3_bucket_outputs: str = "trueshot-outputs"
    s3_endpoint_url: str | None = None
    cloudfront_domain: str | None = None

    # Auth
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""

    # Payments
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # AI Providers
    openai_api_key: str = ""
    replicate_api_key: str = ""
    stability_api_key: str = ""

    # Security
    internal_api_secret: str = "change_me"

    # Observability
    sentry_dsn: str = ""

    # Generation limits
    max_reference_images: int = 15
    min_reference_images: int = 8
    max_upload_size_mb: int = 20
    presigned_url_expiry_seconds: int = 3600

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
