from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.logger import get_logger
from app.core.server_scope import ensure_local_server
from app.services.system.system_service import SystemService

logger = get_logger(__name__)

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/snapshot")
async def system_snapshot(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = SystemService()
    return service.build_system_snapshot()


@router.get("/alerts")
async def system_alerts(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """
    Return system alert flags for frontend consumption.
    """
    ensure_local_server(server_id)
    service = SystemService()
    return service.build_system_alerts_snapshot()


@router.get("/info")
async def system_info(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = SystemService()

    return service.build_host_info()


@router.get("/disk")
async def system_disk(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = SystemService()
    return {"partitions": service.get_system_disk()}


@router.get("/disk/processes")
async def system_disk_processes(
    mountpoint: str = Query(..., description="Disk mountpoint, e.g. / or /var"),
    limit: int = Query(10, ge=1, le=50),
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = SystemService()
    return {
        "mountpoint": mountpoint,
        "processes": service.get_disk_processes(
            mountpoint=mountpoint,
            limit=limit,
        ),
    }

@router.get("/disk/total")
async def system_root_disk(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = SystemService()
    return service.get_root_disk_usage()


# SI LO ESTAS EJECUTANDO DESDE WSL, LO QUE PASA ES QUE WSL SOLO VE EL DISCO VIRTUAL QUE TIENE
# ASIGNADO, NO EL USO REAL DEL DISCO DE WINDOWS
