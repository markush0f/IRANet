import asyncio
from urllib.parse import urlencode
from uuid import UUID
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlmodel.ext.asyncio.session import AsyncSession
import websockets

from app.core.config import get_agent_shared_token
from app.core.database import get_session
from app.models.entities.application import Application
from app.services.remote_agent_service import RemoteAgentService
from app.services.logs_service import ApplicationLogsService


router = APIRouter(prefix="/logs", tags=["logs"])


def _build_remote_ws_url(agent_base_url: str, application_id: UUID, params: dict[str, str]) -> str:
    base = agent_base_url.rstrip("/")
    if base.startswith("https://"):
        ws_base = "wss://" + base[len("https://"):]
    elif base.startswith("http://"):
        ws_base = "ws://" + base[len("http://"):]
    else:
        ws_base = base

    query = urlencode(params)
    return f"{ws_base}/logs/ws/applications/{application_id}/file?{query}"


async def _proxy_log_websocket(
    *,
    websocket: WebSocket,
    remote_url: str,
) -> None:
    headers = {}
    token = get_agent_shared_token()
    if token:
        headers["X-IRA-Agent-Token"] = token

    await websocket.accept()

    async with websockets.connect(remote_url, additional_headers=headers) as remote_socket:
        async def remote_to_client() -> None:
            async for message in remote_socket:
                if isinstance(message, bytes):
                    await websocket.send_bytes(message)
                else:
                    await websocket.send_text(message)

        async def client_to_remote() -> None:
            while True:
                message = await websocket.receive_text()
                await remote_socket.send(message)

        remote_task = asyncio.create_task(remote_to_client())
        client_task = asyncio.create_task(client_to_remote())

        done, pending = await asyncio.wait(
            {remote_task, client_task},
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

        for task in done:
            task.result()


@router.websocket("/ws/applications/{application_id}/file")
async def application_log_file_ws(
    websocket: WebSocket,
    application_id: UUID,
    file_path: str,
    levels: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> None:
    remote = RemoteAgentService(session)
    application = await session.get(Application, application_id)
    if application is None:
        await websocket.close(code=4404)
        return

    if remote.should_proxy(application.server_id):
        server = await remote.get_server(application.server_id)
        if server is None or not server.agent_base_url:
            await websocket.close(code=4404)
            return

        params = {"file_path": file_path}
        if levels:
            params["levels"] = levels
        if search:
            params["search"] = search

        remote_url = _build_remote_ws_url(server.agent_base_url, application_id, params)
        try:
            await _proxy_log_websocket(websocket=websocket, remote_url=remote_url)
        except WebSocketDisconnect:
            pass
        return

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
    remote = RemoteAgentService(session)
    application = await session.get(Application, application_id)
    if application is None:
        return {"page": page, "page_size": page_size, "total": 0, "items": []}

    if remote.should_proxy(application.server_id):
        return await remote.get_json(
            server_id=application.server_id,
            path=f"/logs/applications/{application_id}/files",
            params={"page": page, "page_size": page_size},
        )

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
    remote = RemoteAgentService(session)
    application = await session.get(Application, application_id)
    if application is None:
        return []

    if remote.should_proxy(application.server_id):
        return await remote.get_json(
            server_id=application.server_id,
            path=f"/logs/applications/{application_id}/files/history",
            params={"file_path": file_path, "limit": limit},
        )

    service = ApplicationLogsService(session)

    return await service.get_application_log_file_history(
        application_id=application_id,
        file_path=file_path,
        limit=limit,
    )

# @router.post("/applications/{application_id}/logs/rescan")
# async def rescan_application_logs(
#     application_id: UUID,
#     session: AsyncSession = Depends(get_session),
# ):
#     service = ApplicationLogsService(session)

#     added = await service.rescan_application_logs(
#         application_id=application_id,
#     )

#     return {
#         "added": added,
#     }

# TODO get logs from file with specific date range
