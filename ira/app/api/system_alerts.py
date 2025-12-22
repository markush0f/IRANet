from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.websocket_manager import ws_manager
from app.services.system.system_alerts_service import SystemAlertsService

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
    session: AsyncSession = Depends(get_session),
):
    """
    Return paginated alerts stored in the database.
    """

    service = SystemAlertsService(session)
    return await service.get_system_alerts_paginated(page=page, page_size=page_size)
