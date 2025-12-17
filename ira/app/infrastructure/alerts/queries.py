"""Database helpers to read system alerts."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from app.core.database import get_db_pool


def _record_to_dict(record: Any) -> Dict[str, Any]:
    resolved = record["resolved_at"]
    return {
        "id": str(record["id"]),
        "host": record["host"],
        "metric": record["metric"],
        "level": record["level"],
        "value": float(record["value"]),
        "threshold": float(record["threshold"]),
        "status": record["status"],
        "message": record["message"],
        "first_seen_at": record["first_seen_at"].isoformat(),
        "last_seen_at": record["last_seen_at"].isoformat(),
        "resolved_at": resolved.isoformat() if resolved else None,
    }


async def fetch_alerts_paginated(
    limit: int,
    offset: int,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Return paginated alerts and total count ordered by ``last_seen_at``.
    """

    data_query = """
        SELECT
            id,
            host,
            metric,
            level,
            value,
            threshold,
            status,
            message,
            first_seen_at,
            last_seen_at,
            resolved_at
        FROM system_alerts
        ORDER BY last_seen_at DESC
        LIMIT $1
        OFFSET $2
    """

    count_query = "SELECT COUNT(*) FROM system_alerts"

    pool = await get_db_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(data_query, limit, offset)
        total = await conn.fetchval(count_query)

    return [_record_to_dict(row) for row in rows], int(total)
