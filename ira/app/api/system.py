from fastapi import APIRouter

from app.core.logger import get_logger
from app.modules.system.docker import get_docker_containers, stop_docker_container
from app.modules.system.metrics import get_system_metrics
from app.modules.system.nginx import get_nginx_status, reload_nginx
from app.services.system import (
    get_service_status,
    list_services,
    restart_service,
    start_service,
    stop_service,
)
from app.services.processes.processes_memory import get_memory_info


logger = get_logger(__name__)

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/metrics")
def system_metrics():
    """Get aggregated system metrics."""
    logger.debug("GET /system/metrics called")
    return get_system_metrics()


@router.get("/containers")
def system_containers():
    """List Docker containers available on the host."""
    logger.debug("GET /system/containers called")
    return get_docker_containers()


@router.post("/containers/{container_id}/stop")
def stop_container(container_id: str):
    """Stop a Docker container by ID or name."""
    logger.info("POST /system/containers/%s/stop called", container_id)
    return stop_docker_container(container_id)


@router.get("/nginx/status")
def nginx_status():
    """Get the status of the Nginx service."""
    logger.debug("GET /system/nginx/status called")
    return get_nginx_status()


@router.post("/nginx/reload")
def nginx_reload():
    """Reload the Nginx service configuration."""
    logger.info("POST /system/nginx/reload called")
    return reload_nginx()


@router.get("/services")
def system_services():
    """List system services available on the host."""
    logger.debug("GET /system/services called")
    return list_services()


@router.get("/services/{service_name}/status")
def service_status(service_name: str):
    """Get the status of a system service."""
    logger.debug("GET /system/services/%s/status called", service_name)
    return get_service_status(service_name)


@router.post("/services/{service_name}/start")
def service_start(service_name: str):
    """Start a system service."""
    logger.info("POST /system/services/%s/start called", service_name)
    return start_service(service_name)


@router.post("/services/{service_name}/stop")
def service_stop(service_name: str):
    """Stop a system service."""
    logger.info("POST /system/services/%s/stop called", service_name)
    return stop_service(service_name)


@router.post("/services/{service_name}/restart")
def service_restart(service_name: str):
    """Restart a system service."""
    logger.info("POST /system/services/%s/restart called", service_name)
    return restart_service(service_name)

@router.get("/memory/info")
def memory_info():
    """Get system memory information."""
    logger.debug("GET /system/memory/info called")
    return get_memory_info()