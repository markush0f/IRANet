from uuid import UUID
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.services.logs_service import ApplicationLogsService


router = APIRouter(prefix="/logs", tags=["logs"])


@router.websocket("/ws/applications/{application_id}/file")
async def application_log_file_ws(
    websocket: WebSocket,
    application_id: UUID,
    file_path: str,
    levels: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> None:
    service = ApplicationLogsService(session)

    try:
        await service.stream_application_log_file(
            application_id=application_id,
            file_path=file_path,
            websocket=websocket,
            levels=levels,
            search=search,
        )
    except WebSocketDisconnect:
        pass


@router.get("/applications/{application_id}/files")
async def application_log_files(
    application_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationLogsService(session)

    return await service.get_application_log_files(
        application_id=application_id,
        page=page,
        page_size=page_size,
    )


@router.get("/applications/{application_id}/files/history")
async def application_log_file_history(
    application_id: UUID,
    file_path: str,
    limit: int = Query(200, ge=1, le=1000),
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationLogsService(session)

    return await service.get_application_log_file_history(
        application_id=application_id,
        file_path=file_path,
        limit=limit,
    )

@router.post("/applications/{application_id}/logs/rescan")
async def rescan_application_logs(
    application_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    service = ApplicationLogsService(session)

    added = await service.rescan_application_logs(
        application_id=application_id,
    )

    return {
        "added": added,
    }

# TODO get logs from file with specific date range
