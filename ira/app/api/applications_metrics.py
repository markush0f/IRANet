from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.services.applications.applications_metrics import ApplicationMetricsService


router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/{application_id}/metrics")
async def application_metrics(
    application_id: UUID,
    ts_from: datetime = Query(...),
    ts_to: datetime = Query(...),
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationMetricsService(session)
    return await service.list_metrics(
        application_id=application_id,
        ts_from=ts_from,
        ts_to=ts_to,
    )


@router.get("/{application_id}/metrics/latest")
async def application_metrics_latest(
    application_id: UUID,
    limit: int = Query(1, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationMetricsService(session)
    return await service.list_latest_metrics(
        application_id=application_id,
        limit=limit,
    )
