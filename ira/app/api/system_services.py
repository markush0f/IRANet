from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.logger import get_logger
from app.core.server_scope import ensure_local_server
from app.infrastructure.docker.client import (
    list_all_containers,
    list_exited_containers,
    list_running_containers,
)
from app.services.system.simple_services_service import SimpleServicesService


logger = get_logger(__name__)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/docker/all/containers")
async def docker_containers(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    return list_all_containers()


@router.get("/docker/running/containers")
async def docker_running_containers(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    return list_running_containers()


@router.get("/docker/exited/containers")
async def docker_exited_containers(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    return list_exited_containers()


@router.get("/systemd/simple")
async def get_system_simple_services(
    limit: int = Query(10, ge=1, le=100),
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = SimpleServicesService()
    return service.get_simple_services(limit)
