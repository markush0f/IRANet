from datetime import datetime
from typing import List, Dict

from app.infrastructure.metrics.queries import query_metric_series



async def get_metric_series(
    metric: str,
    ts_from: datetime,
    ts_to: datetime,
    host: str,
) -> List[Dict]:
    if ts_from >= ts_to:
        raise ValueError("ts_from must be earlier than ts_to")

    rows = await query_metric_series(
        metric=metric,
        ts_from=ts_from,
        ts_to=ts_to,
        host=host,
    )

    return [
        {
            "ts": ts,
            "value": value,
        }
        for ts, value in rows
    ]
