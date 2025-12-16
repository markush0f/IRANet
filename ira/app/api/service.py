from fastapi import APIRouter
from app.core.logger import get_logger
from app.services.infrastructure.docker.client import list_all_containers, list_exited_containers, list_running_containers


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