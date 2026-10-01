from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PhotoshootCreate(BaseModel):
    style_pack_ids: list[str] = Field(min_length=1, max_length=6)
    title: str | None = Field(default=None, max_length=200)


class PhotoshootResponse(BaseModel):
    id: str
    user_id: str
    workspace_id: str | None
    title: str | None
    status: str
    style_pack_ids: list[str]
    reference_image_count: int
    generated_count: int
    quality_pass_count: int
    error_message: str | None
    started_at: str | None
    completed_at: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PhotoshootStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    current_step: str | None
    estimated_seconds_remaining: int | None
    completed_at: str | None
    error_message: str | None


class ReferenceImageResponse(BaseModel):
    id: str
    photoshoot_id: str
    storage_key: str
    file_name: str
    file_size: int
    mime_type: str
    quality_signals: dict[str, Any] | None
    is_rejected: bool
    rejection_reason: str | None
    uploaded_at: str

    class Config:
        from_attributes = True


class PresignedUploadRequest(BaseModel):
    photoshoot_id: str
    file_name: str = Field(max_length=255)
    mime_type: str


class PresignedUploadResponse(BaseModel):
    upload_url: str
    storage_key: str
    fields: dict[str, str]
    expires_at: str


class UploadConfirmRequest(BaseModel):
    photoshoot_id: str
    storage_key: str
    file_name: str
    file_size: int = Field(gt=0, le=20 * 1024 * 1024)
    mime_type: str


class ValidateReferenceResponse(BaseModel):
    passed: bool
    feedback: list[str]
    image_count: int
    rejected_count: int
    overall_quality: float
