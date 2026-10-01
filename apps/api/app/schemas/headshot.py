from datetime import datetime
from typing import Any
from pydantic import BaseModel


class QualityScoreSchema(BaseModel):
    model_config = {"extra": "allow"}

    identity_similarity: float = 0.0
    face_quality: float = 0.0
    sharpness: float = 0.0
    natural_eyes: float = 0.0
    skin_texture: float = 0.0
    symmetry: float = 0.0
    background_artifacts: float = 0.0
    composition: float = 0.0
    teeth_artifacts: float | None = None
    overall_score: float | None = None
    passed_quality_gate: bool | None = None
    rejection_reasons: list[str] = []


class HeadshotResponse(BaseModel):
    id: str
    photoshoot_id: str
    style_pack_id: str
    storage_key: str
    thumbnail_key: str
    prompt: str | None = None
    model_id: str | None = None
    quality_score: dict[str, Any] | None = None
    overall_score: float = 0.0
    rank: int = 999
    is_favorited: bool = False
    is_rejected: bool = False
    generated_at: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HeadshotFavoriteRequest(BaseModel):
    is_favorited: bool
