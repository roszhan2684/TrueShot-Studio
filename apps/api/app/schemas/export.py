from datetime import datetime

from pydantic import BaseModel


VALID_EXPORT_FORMATS = {
    "linkedin_portrait",
    "square_avatar",
    "team_page_card",
    "speaker_profile",
    "press_kit_4k",
    "transparent_png",
    "grayscale_pr",
    "email_signature",
}

EXPORT_DIMENSIONS: dict[str, tuple[int, int]] = {
    "linkedin_portrait": (800, 800),
    "square_avatar": (400, 400),
    "team_page_card": (600, 600),
    "speaker_profile": (1200, 900),
    "press_kit_4k": (3840, 2160),
    "transparent_png": (0, 0),   # original resolution — resolved at render time
    "grayscale_pr": (1200, 1200),
    "email_signature": (300, 300),
}


class ExportCreate(BaseModel):
    headshot_id: str
    format: str
    edit_job_id: str | None = None


class ExportResponse(BaseModel):
    id: str
    headshot_id: str
    edit_job_id: str | None
    user_id: str
    format: str
    status: str
    storage_key: str | None
    file_size: int | None
    width_px: int
    height_px: int
    expires_at: str | None
    created_at: datetime

    class Config:
        from_attributes = True
