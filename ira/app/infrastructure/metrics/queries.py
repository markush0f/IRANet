from typing import List, Tuple

from app.core.database import get_db_pool


async def query_metric_series(
    metric: str,
    ts_from: int,
    ts_to: int,
    host: str,
) -> List[Tuple[int, float]]:
    pool = await get_db_pool()

    query = """
        SELECT
            EXTRACT(EPOCH FROM ts)::BIGINT AS ts,
            value
        FROM metrics_points
        WHERE metric = $1
          AND host = $2
          AND ts BETWEEN to_timestamp($3) AND to_timestamp($4)
        ORDER BY ts ASC
    """

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            query,
            metric,
            host,
            ts_from,
            ts_to,
        )

    return [(int(r["ts"]), float(r["value"])) for r in rows]
