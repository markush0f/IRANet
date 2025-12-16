from fastapi import APIRouter, Query
from datetime import datetime

from app.services.metrics.series import get_metric_series

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/series")
async def metric_series(
    metric: str,
    from_ts: datetime = Query(...),
    to_ts: datetime = Query(...),
    host: str = Query(...),
):
    return await get_metric_series(metric, from_ts, to_ts, host)
