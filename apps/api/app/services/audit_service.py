from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditEvent


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        metadata: dict | None = None,
        workspace_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditEvent:
        event = AuditEvent(
            user_id=user_id,
            workspace_id=workspace_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            event_metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(event)
        await self.db.commit()
        return event
