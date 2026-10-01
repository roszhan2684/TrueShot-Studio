from datetime import datetime, timedelta, timezone

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.security import generate_token, hash_token
from app.db.base import get_db
from app.models.user import TeamInvite, Workspace
from app.schemas.workspace import InviteCreate, InviteResponse, WorkspaceCreate, WorkspaceResponse
from app.services.audit_service import AuditService

log = structlog.get_logger(__name__)
router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: WorkspaceCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    # Enforce one workspace per user for now
    if current_user.workspace_id:
        raise HTTPException(status_code=409, detail="User already belongs to a workspace")

    # Check slug uniqueness
    existing = await db.execute(select(Workspace).where(Workspace.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Slug already taken")

    ws = Workspace(name=body.name, slug=body.slug, owner_id=current_user.id)
    db.add(ws)
    await db.flush()

    current_user.workspace_id = ws.id
    await db.commit()
    await db.refresh(ws)

    await AuditService(db).log(
        user_id=current_user.id,
        action="workspace.created",
        resource_type="workspace",
        resource_id=ws.id,
    )
    return {"data": _ws_to_response(ws, member_count=1)}


@router.get("/mine")
async def get_my_workspace(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace")
    result = await db.execute(
        select(Workspace).where(Workspace.id == current_user.workspace_id)
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    from app.models.user import User
    member_result = await db.execute(
        select(User).where(User.workspace_id == ws.id)
    )
    member_count = len(member_result.scalars().all())
    return {"data": _ws_to_response(ws, member_count)}


@router.post("/{workspace_id}/invites", status_code=status.HTTP_201_CREATED)
async def invite_member(
    workspace_id: str,
    body: InviteCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    ws = await _get_owned_workspace(workspace_id, current_user.id, db)

    token = generate_token(32)
    token_hash = hash_token(token)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    invite = TeamInvite(
        workspace_id=ws.id,
        email=body.email,
        role=body.role,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    # TODO: send invite email via background task

    return {
        "data": InviteResponse(
            id=invite.id,
            workspace_id=invite.workspace_id,
            email=invite.email,
            role=invite.role,
            expires_at=invite.expires_at,
            accepted_at=invite.accepted_at,
        )
    }


@router.get("/{workspace_id}/invites")
async def list_invites(
    workspace_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_workspace(workspace_id, current_user.id, db)
    result = await db.execute(
        select(TeamInvite).where(TeamInvite.workspace_id == workspace_id)
    )
    invites = result.scalars().all()
    return {
        "data": [
            InviteResponse(
                id=i.id,
                workspace_id=i.workspace_id,
                email=i.email,
                role=i.role,
                expires_at=i.expires_at,
                accepted_at=i.accepted_at,
            )
            for i in invites
        ]
    }


@router.delete("/{workspace_id}/invites/{invite_id}")
async def revoke_invite(
    workspace_id: str,
    invite_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_workspace(workspace_id, current_user.id, db)
    result = await db.execute(
        select(TeamInvite).where(
            TeamInvite.id == invite_id,
            TeamInvite.workspace_id == workspace_id,
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    await db.delete(invite)
    await db.commit()
    return {"message": "revoked"}


# ─── Helpers ────────────────────────────────────────────────────────────────

async def _get_owned_workspace(ws_id: str, user_id: str, db: AsyncSession) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.id == ws_id, Workspace.owner_id == user_id)
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


def _ws_to_response(ws: Workspace, member_count: int) -> WorkspaceResponse:
    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        owner_id=ws.owner_id,
        plan=ws.plan,
        member_count=member_count,
    )
