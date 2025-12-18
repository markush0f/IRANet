from typing import Optional, List, Dict
from uuid import UUID

from app.core.database import get_db_pool


async def query_application_by_identifier(
    identifier: str,
) -> Optional[Dict]:
    pool = await get_db_pool()

    query = """
        SELECT
            id,
            kind,
            identifier,
            name,
            workdir,
            file_path,
            port,
            pid,
            status,
            enabled,
            last_seen_at,
            created_at
        FROM applications
        WHERE identifier = $1
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, identifier)

    return dict(row) if row else None


async def query_all_applications() -> List[Dict]:
    pool = await get_db_pool()

    query = """
        SELECT
            id,
            kind,
            identifier,
            name,
            workdir,
            file_path,
            port,
            pid,
            status,
            enabled,
            last_seen_at,
            created_at
        FROM applications
        ORDER BY created_at DESC
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query)

    return [dict(r) for r in rows]


