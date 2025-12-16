import asyncpg
from typing import Optional

from app.core.config import get_database_dsn

_pool: Optional[asyncpg.Pool] = None


async def init_db_pool():
    dsn = get_database_dsn()
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(dsn)


async def get_db_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    return _pool


async def close_db_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
