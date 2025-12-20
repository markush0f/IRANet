from fastapi import APIRouter
from app.core.logger import get_logger
from app.services.system_service import SystemService

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