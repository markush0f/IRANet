from fastapi import APIRouter, Depends, Query
from datetime import datetime

from app.core.database import get_session
from app.services.metrics.metrics_service import SystemMetricsService
from sqlmodel.ext.asyncio.session import AsyncSession


router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/series")
async def metric_series(
    metric: str,
    ts_from: datetime = Query(...),
    ts_to: datetime = Query(...),
    host: str = Query(...),
    session: AsyncSession = Depends(get_session),
):
    service = SystemMetricsService(session)
    return await service.get_metric_series(
        metric=metric, ts_from=ts_from, ts_to=ts_to, host=host
    )
