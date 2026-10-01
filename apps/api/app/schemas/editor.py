from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EditJobCreate(BaseModel):
    headshot_id: str
    edit_type: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class EditJobResponse(BaseModel):
    id: str
    headshot_id: str
    user_id: str
    status: str
    edit_type: str
    parameters: dict[str, Any]
    result_storage_key: str | None
    result_thumbnail_key: str | None
    error_message: str | None
    started_at: str | None
    completed_at: str | None
    created_at: datetime

    class Config:
        from_attributes = True
