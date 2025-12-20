from fastapi import APIRouter, Query

from app.services.metrics.internet_metrics_service import InternetService


router = APIRouter(prefix="/internet", tags=["internet"])


@router.get("/snapshot")
async def internet_snapshot(
    ping_host: str = Query("1.1.1.1"),
):
    service = InternetService(ping_host=ping_host)
    return await service.get_snapshot()
