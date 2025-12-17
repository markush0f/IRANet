from typing import Dict, Set
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, channel: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.setdefault(channel, set()).add(websocket)

    def disconnect(self, channel: str, websocket: WebSocket) -> None:
        self.connections.get(channel, set()).discard(websocket)

    async def broadcast(self, channel: str, message: dict) -> None:
        for ws in list(self.connections.get(channel, [])):
            await ws.send_json(message)


ws_manager = WebSocketManager()
