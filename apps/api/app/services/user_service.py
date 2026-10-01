from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

log = structlog.get_logger(__name__)


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_clerk_id(self, clerk_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.clerk_id == clerk_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create_from_clerk(
        self,
        clerk_id: str,
        email: str,
        name: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        user = User(
            clerk_id=clerk_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        log.info("user_created", user_id=user.id, clerk_id=clerk_id)
        return user

    async def update_from_clerk(
        self,
        user: User,
        email: str | None = None,
        name: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        if email is not None:
            user.email = email
        if name is not None:
            user.name = name
        if avatar_url is not None:
            user.avatar_url = avatar_url
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def deactivate(self, user: User) -> None:
        user.is_active = False
        await self.db.commit()
        log.info("user_deactivated", user_id=user.id)

    async def request_data_deletion(self, user: User) -> None:
        ts = datetime.now(timezone.utc).isoformat()
        user.data_deletion_requested_at = ts
        await self.db.commit()
        log.info("data_deletion_requested", user_id=user.id)
