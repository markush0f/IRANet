from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.server_scope import ensure_local_server
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
    ensure_local_server(server_id)
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
    ensure_local_server(server_id)
    service = ProcessesService()
    return service.build_process_snapshot(pid)
