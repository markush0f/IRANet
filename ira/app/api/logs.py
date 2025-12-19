from uuid import UUID
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.services.logs.service import (
    get_application_log_file_history,
    get_application_log_files,
    stream_application_logs,
)

router = APIRouter(prefix="/logs", tags=["logs"])


@router.websocket("/ws/applications/{application_id}")
async def application_logs_ws(
    websocket: WebSocket,
    application_id: UUID,
) -> None:
    try:
        await stream_application_logs(
            application_id=application_id,
            websocket=websocket,
        )
    except WebSocketDisconnect:
        pass


@router.get("/applications/{application_id}/files")
async def application_log_files(
    application_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return await get_application_log_files(
        application_id=application_id,
        page=page,
        page_size=page_size,
    )


@router.get("/applications/{application_id}/files/history")
async def application_log_file_history(
    application_id: UUID,
    file_path: str,
    limit: int = Query(200, ge=1, le=1000),
):
    return await get_application_log_file_history(
        application_id=application_id,
        file_path=file_path,
        limit=limit,
    )