import re

from pydantic import BaseModel, Field, field_validator


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=50)

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError("Slug may only contain lowercase letters, numbers, and hyphens")
        return v


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    owner_id: str
    plan: str
    member_count: int


class InviteCreate(BaseModel):
    email: str
    role: str = "member"

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("admin", "member"):
            raise ValueError("Role must be admin or member")
        return v


class InviteResponse(BaseModel):
    id: str
    workspace_id: str
    email: str
    role: str
    expires_at: str
    accepted_at: str | None
