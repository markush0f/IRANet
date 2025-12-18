from typing import List, Dict
from uuid import UUID

from app.core.database import get_db_pool


async def insert_application_log(
    *,
    application_id: UUID,
    path: str,
    discovered: bool = True,
    enabled: bool = True,
) -> None:
    pool = await get_db_pool()

    query = """
        INSERT INTO application_logs (
            application_id,
            path,
            discovered,
            enabled
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (application_id, path)
        DO NOTHING
    """

    async with pool.acquire() as conn:
        await conn.execute(
            query,
            application_id,
            path,
            discovered,
            enabled,
        )
