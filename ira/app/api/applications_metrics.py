from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
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


@router.get(
    "/{application_id}/runtime",
    summary="Get application runtime info (pid/port/memory/last_seen)",
)
async def application_runtime_snapshot(
    application_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationMetricsService(session)
    return await service.get_runtime_snapshot(application_id=application_id)


@router.get(
    "/{application_id}/metrics/series",
    summary="Get application metrics as time series",
)
async def get_application_metrics_series(
    application_id: UUID,
    ts_from: datetime = Query(...),
    ts_to: datetime = Query(...),
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationMetricsService(session)

    try:
        return await service.list_metrics_series(
            application_id=application_id,
            ts_from=ts_from,
            ts_to=ts_to,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
