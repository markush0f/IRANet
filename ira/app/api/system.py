from fastapi import APIRouter
from app.core.logger import get_logger
from app.services.system.system_alerts_snapshot import build_system_alerts_snapshot
from app.services.system.system_snapshot import build_system_snapshot

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
