from fastapi import APIRouter
from app.modules.system.metrics import get_system_metrics

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/metrics")
def system_metrics():
    return get_system_metrics()
