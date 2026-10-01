import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import get_db
from app.schemas.privacy import (
    DataDeletionResponse,
    PrivacySettingsResponse,
    UpdateRetentionRequest,
)
from app.services.audit_service import AuditService
from app.services.privacy_service import PrivacyService
from app.services.user_service import UserService

log = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/settings")
async def get_privacy_settings(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = PrivacyService(db)
    settings_data = await service.get_privacy_settings(current_user.id)
    return {"data": PrivacySettingsResponse(**settings_data)}


@router.delete("/data", status_code=status.HTTP_200_OK)
async def delete_all_data(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Full GDPR/CCPA-compliant data deletion.
    Deletes all uploads, headshots, edit jobs, exports, embeddings, and billing records.
    Audit events are retained for 90 days per compliance policy.
    """
    privacy_service = PrivacyService(db)
    user_service = UserService(db)
    audit_service = AuditService(db)

    counts = await privacy_service.delete_all_user_data(current_user.id)
    await user_service.request_data_deletion(current_user)
    await audit_service.log(
        user_id=current_user.id,
        action="data.deleted_all",
        resource_type="user",
        resource_id=current_user.id,
        metadata=counts,
    )

    log.info("user_data_deletion_complete", user_id=current_user.id, **counts)
    return {
        "data": DataDeletionResponse(
            message="All data has been deleted.",
            deleted_uploads=counts["deleted_uploads"],
            deleted_headshots=counts["deleted_headshots"],
            deleted_exports=counts["deleted_exports"],
            deleted_edit_jobs=counts["deleted_edit_jobs"],
            embedding_cleared=counts["embedding_cleared"],
        )
    }


@router.get("/audit-log")
async def get_audit_log(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    page_size: int = 50,
):
    from sqlalchemy import desc, select
    from app.models.audit import AuditEvent

    offset = (page - 1) * page_size
    result = await db.execute(
        select(AuditEvent)
        .where(AuditEvent.user_id == current_user.id)
        .order_by(desc(AuditEvent.created_at))
        .offset(offset)
        .limit(page_size)
    )
    events = result.scalars().all()
    return {
        "data": [
            {
                "id": e.id,
                "action": e.action,
                "resource_type": e.resource_type,
                "resource_id": e.resource_id,
                "metadata": e.metadata,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]
    }
