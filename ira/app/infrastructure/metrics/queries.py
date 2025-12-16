from datetime import datetime
from typing import List, Tuple

from app.core.database import get_db_pool


async def query_metric_series(
    metric: str,
    ts_from: datetime,
    ts_to: datetime,
    host: str,
) -> List[Tuple[datetime, float]]:
    pool = await get_db_pool()

    query = """
        SELECT
            ts,
            value
        FROM metrics_points
        WHERE metric = $1
          AND host = $2
          AND ts BETWEEN $3 AND $4
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

    return [(r["ts"], float(r["value"])) for r in rows]
