from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.services.remote_agent_service import RemoteAgentService
from app.services.processes_service import ProcessesService




router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/snapshot")
async def processes_snapshot(
    limit: int = Query(20, ge=1, le=100),
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """
    Return a full processes snapshot.

    Includes:
    - system header (top-like)
    - processes table
    """
    remote = RemoteAgentService(session)
    target_server_id = remote.require_live_server_id(server_id)
    if remote.should_proxy(target_server_id):
        return await remote.get_json(
            server_id=target_server_id,
            path="/processes/snapshot",
            params={"limit": limit},
        )
    remote.validate_local_scope(server_id)
    service = ProcessesService()
    return service.build_processes_snapshot(limit)


@router.get("/{pid}")
async def process_snapshot(
    pid: int,
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """
    Return a full snapshot of a single process.
    """
    remote = RemoteAgentService(session)
    target_server_id = remote.require_live_server_id(server_id)
    if remote.should_proxy(target_server_id):
        return await remote.get_json(
            server_id=target_server_id,
            path=f"/processes/{pid}",
        )
    remote.validate_local_scope(server_id)
    service = ProcessesService()
    return service.build_process_snapshot(pid)
