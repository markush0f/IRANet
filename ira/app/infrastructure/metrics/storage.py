"""Helpers to persist metrics points into the database."""

from typing import List

from app.core.database import get_db_pool
from app.core.logger import get_logger
from app.modules.types.METRIC_POINT import MetricPoint

logger = get_logger(__name__)


async def insert_metric_points(points: List[MetricPoint]) -> None:
    """
    Persist a batch of metric points in the PostgreSQL metrics_points table.

    Args:
        points: Sequence of MetricPoint mappings containing ``ts``, ``metric``,
            ``value`` and ``host`` keys.

    The function short-circuits when the input list is empty and uses a single
    prepared INSERT query executed with ``executemany`` for efficiency.
    """

    if not points:
        logger.debug("insert_metric_points skipped - no point batches")
        return

    pool = await get_db_pool()

    query = """
        INSERT INTO metrics_points (ts, metric, value, host)
        VALUES ($1, $2, $3, $4)
    """

    async with pool.acquire() as conn:
        await conn.executemany(
            query,
            [
                (p["ts"], p["metric"], p["value"], p["host"])
                for p in points
            ],
        )
    # logger.info("inserted %d metric points", len(points))
