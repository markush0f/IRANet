
from typing import Dict, List
from uuid import UUID
from app.core.database import get_db_pool


async def query_application_logs(
    *,
    application_id: UUID,
) -> List[Dict]:
    pool = await get_db_pool()

    query = """
        SELECT
            id,
            path,
            enabled,
            discovered,
            created_at
        FROM application_logs
        WHERE application_id = $1
        ORDER BY created_at ASC
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, application_id)

    return [dict(r) for r in rows]
