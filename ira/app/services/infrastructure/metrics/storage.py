from typing import List
from app.core.database import get_db_pool
from app.modules.types.METRIC_POINT import MetricPoint


async def insert_metric_points(points: List[MetricPoint]) -> None:
    if not points:
        return

    pool = await get_db_pool()

    query = """
        INSERT INTO metrics_points (ts, metric, value, host)
        VALUES ($1, $2, $3, $4)
    """

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.executemany(
                query,
                [(p["ts"], p["metric"], p["value"], p["host"]) for p in points],
            )
