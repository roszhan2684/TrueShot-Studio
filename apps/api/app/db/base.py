"""
Database setup — supports both PostgreSQL (production) and SQLite (demo/dev).
"""
import os
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite+aiosqlite:////tmp/trueshot_demo.db",
)

# SQLite needs check_same_thread disabled; Postgres needs pool settings
_connect_args = {"check_same_thread": False} if "sqlite" in _DATABASE_URL else {}

engine = create_async_engine(
    _DATABASE_URL,
    echo=False,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(AsyncAttrs, DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables (used in demo mode instead of Alembic migrations)."""
    import app.models  # noqa: F401 — ensures all models are registered
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
