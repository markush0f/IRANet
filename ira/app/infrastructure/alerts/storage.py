"""Helpers to persist critical alerts into Postgres."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.core.database import get_db_pool
from app.core.logger import get_logger

logger = get_logger(__name__)


async def insert_critical_alert(
    *,
    host: str,
    metric: str,
    level: str,
    value: float,
    threshold: float,
    message: str,
) -> None:
    """
    Persist a single critical alert event.
    """

    now = datetime.now(timezone.utc)
    alert_id = uuid.uuid4()

    query = """
        INSERT INTO system_alerts (
            id,
            host,
            metric,
            level,
            value,
            threshold,
            status,
            message,
            first_seen_at,
            last_seen_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    """

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        await conn.execute(
            query,
            alert_id,
            host,
            metric,
            level,
            value,
            threshold,
            "active",
            message,
            now,
            now,
        )

    logger.debug(
        "Inserted alert record %s (%s) for host %s",
        alert_id,
        metric,
        host,
    )
