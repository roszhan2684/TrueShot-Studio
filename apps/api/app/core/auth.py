"""
Auth — demo mode: resolves/creates a user from the X-Demo-User header.
No Clerk JWT verification needed.
"""
from typing import Annotated

import structlog
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.models.user import User

log = structlog.get_logger(__name__)

DEMO_EMAIL = "demo@trueshot.ai"


async def get_current_user(
    x_demo_user: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    email = x_demo_user or DEMO_EMAIL

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create demo user on first request
        import ulid
        user = User(
            id=str(ulid.new()),
            clerk_id=f"demo_{email.replace('@','_').replace('.','_')}",
            email=email,
            name="Demo User",
            is_active=True,
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except Exception:
            await db.rollback()
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one()

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
