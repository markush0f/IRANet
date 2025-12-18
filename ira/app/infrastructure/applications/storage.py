from typing import Optional
from uuid import UUID
from app.core.database import get_db_pool


async def insert_application(
    *,
    kind: str,
    identifier: str,
    name: str,
    workdir: str,
    file_path: Optional[str] = None,
    port: Optional[int] = None,
    enabled: bool = False,
    status: str = "running",
) -> UUID:
    pool = await get_db_pool()

    query = """
        INSERT INTO applications (
            kind,
            identifier,
            name,
            workdir,
            file_path,
            port,
            enabled,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            query,
            kind,
            identifier,
            name,
            workdir,
            file_path,
            port,
            enabled,
            status,
        )

    return row["id"]


async def update_application_runtime_state(
    *,
    application_id: UUID,
    status: str,
    pid: Optional[int],
) -> None:
    pool = await get_db_pool()

    query = """
        UPDATE applications
        SET
            status = $1,
            pid = $2,
            last_seen_at = now()
        WHERE id = $3
    """

    async with pool.acquire() as conn:
        await conn.execute(
            query,
            status,
            pid,
            application_id,
        )
