from fastapi import APIRouter
from app.core.logger import get_logger
from app.services.application.system.host_info import build_host_info
from app.services.application.system.snapshot import build_system_alerts_snapshot, build_system_snapshot

logger = get_logger(__name__)

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/snapshot")
def system_snapshot():
    return build_system_snapshot()


@router.get("/alerts")
def system_alerts():
    """
    Return system alert flags for frontend consumption.
    """
    return build_system_alerts_snapshot()

@router.get("/info")
def system_info():
    return build_host_info()