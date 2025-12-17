from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

router = APIRouter()

@router.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket) -> None:
    await ws_manager.connect("alerts", websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect("alerts", websocket)
