from fastapi import APIRouter, Query
from app.core.logger import get_logger
from app.infrastructure.docker.client import (
    list_all_containers,
    list_exited_containers,
    list_running_containers,
)
from app.services.system_services.simple_services_service import SimpleServicesService


logger = get_logger(__name__)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/docker/all/containers")
def docker_containers():
    return list_all_containers()


@router.get("/docker/running/containers")
def docker_running_containers():
    return list_running_containers()


@router.get("/docker/exited/containers")
def docker_exited_containers():
    return list_exited_containers()


@router.get("/systemd/simple")
def get_system_simple_services(
    limit: int = Query(10, ge=1, le=100),
):
    service = SimpleServicesService()
    return service.get_simple_services(limit)
