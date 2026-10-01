from typing import Any

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.security import verify_internal_secret
from app.db.base import get_db
from app.services.user_service import UserService

log = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/me")
async def get_me(current_user: CurrentUser):
    """Return the authenticated user's profile."""
    return {
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "avatar_url": current_user.avatar_url,
            "workspace_id": current_user.workspace_id,
            "created_at": current_user.created_at.isoformat(),
        }
    }


@router.post("/webhook", dependencies=[Depends(verify_internal_secret)])
async def clerk_webhook(
    request: Request,
    x_clerk_event_type: str = Header(alias="X-Clerk-Event-Type"),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives Clerk webhook events forwarded from the Next.js app.
    The Next.js route already verified the svix signature before forwarding.
    """
    payload: dict[str, Any] = await request.json()
    data: dict[str, Any] = payload.get("data", {})
    service = UserService(db)

    if x_clerk_event_type == "user.created":
        email = _extract_primary_email(data)
        if not email:
            raise HTTPException(status_code=400, detail="No email in payload")

        existing = await service.get_by_clerk_id(data["id"])
        if existing:
            return {"message": "already_exists"}

        await service.create_from_clerk(
            clerk_id=data["id"],
            email=email,
            name=_extract_name(data),
            avatar_url=data.get("image_url"),
        )
        log.info("clerk_webhook_user_created", clerk_id=data["id"])

    elif x_clerk_event_type == "user.updated":
        user = await service.get_by_clerk_id(data["id"])
        if user:
            await service.update_from_clerk(
                user,
                email=_extract_primary_email(data),
                name=_extract_name(data),
                avatar_url=data.get("image_url"),
            )

    elif x_clerk_event_type == "user.deleted":
        user = await service.get_by_clerk_id(data["id"])
        if user:
            await service.deactivate(user)

    return {"received": True}


def _extract_primary_email(data: dict[str, Any]) -> str | None:
    addresses: list[dict] = data.get("email_addresses", [])
    primary_id: str | None = data.get("primary_email_address_id")
    for addr in addresses:
        if addr.get("id") == primary_id:
            return addr.get("email_address")
    return addresses[0]["email_address"] if addresses else None


def _extract_name(data: dict[str, Any]) -> str | None:
    parts = [data.get("first_name", ""), data.get("last_name", "")]
    name = " ".join(p for p in parts if p).strip()
    return name or None

