from fastapi import APIRouter, Query
from app.core.logger import get_logger
from app.services.system.system_service import SystemService

logger = get_logger(__name__)

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/snapshot")
def system_snapshot():

    service = SystemService()
    return service.build_system_snapshot()


@router.get("/alerts")
def system_alerts():
    """
    Return system alert flags for frontend consumption.
    """
    service = SystemService()
    return service.build_system_alerts_snapshot()


@router.get("/info")
def system_info():
    service = SystemService()

    return service.build_host_info()


@router.get("/disk")
def system_disk():
    service = SystemService()
    return {"partitions": service.get_system_disk()}


@router.get("/disk/processes")
def system_disk_processes(
    mountpoint: str = Query(..., description="Disk mountpoint, e.g. / or /var"),
    limit: int = Query(10, ge=1, le=50),
):
    service = SystemService()
    return {
        "mountpoint": mountpoint,
        "processes": service.get_disk_processes(
            mountpoint=mountpoint,
            limit=limit,
        ),
    }

@router.get("/disk/total")
def system_root_disk():
    service = SystemService()
    return service.get_root_disk_usage()


# SI LO ESTAS EJECUTANDO DESDE WSL, LO QUE PASA ES QUE WSL SOLO VE EL DISCO VIRTUAL QUE TIENE
# ASIGNADO, NO EL USO REAL DEL DISCO DE WINDOWS