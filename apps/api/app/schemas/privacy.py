from pydantic import BaseModel, Field


class PrivacySettingsResponse(BaseModel):
    user_id: str
    upload_retention_days: int
    output_retention_days: int
    data_deletion_requested_at: str | None
    audit_log_available: bool


class UpdateRetentionRequest(BaseModel):
    upload_retention_days: int = Field(ge=1, le=365)
    output_retention_days: int = Field(ge=1, le=365)


class DataDeletionResponse(BaseModel):
    message: str
    deleted_uploads: int
    deleted_headshots: int
    deleted_exports: int
    deleted_edit_jobs: int
    embedding_cleared: bool
