from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.websocket_manager import ws_manager
from app.services.alerts.service import get_alerts

router = APIRouter(tags=["alerts"])


@router.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket) -> None:
    await ws_manager.connect("alerts", websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect("alerts", websocket)


@router.get("/alerts")
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=250),
):
    """
    Return paginated alerts stored in the database.
    """
    return await get_alerts(page=page, page_size=page_size)
