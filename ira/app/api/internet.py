from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.repositories.metric_point import MetricPointRepository
from app.services.internet.internet_events_service import InternetEventsService


router = APIRouter(prefix="/internet", tags=["internet"])


@router.get("/packet-loss/events")
async def packet_loss_events(
    host: str = Query(...),
    ts_from: datetime = Query(...),
    ts_to: datetime = Query(...),
    session: AsyncSession = Depends(get_session),
):
    repository = MetricPointRepository(session)
    service = InternetEventsService(repository)

    return await service.get_packet_loss_events(
        host=host,
        ts_from=ts_from,
        ts_to=ts_to,
    )
