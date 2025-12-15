from typing import Dict, Any
import time

from app.services.processes.processes_table import get_processes_table
from app.services.processes.processes_header import build_processes_header


def build_processes_snapshot(limit: int = 20) -> Dict[str, Any]:
    """
    Build a full processes snapshot suitable for frontend consumption.

    This snapshot is intended to power top/htop-like views and includes:
    - a system header (uptime, load, cpu, memory, swap)
    - a table of processes ordered by CPU usage
    """
    timestamp = int(time.time())

    header = build_processes_header()
    processes = get_processes_table(limit)

    return {
        "timestamp": timestamp,
        "limit": limit,
        "header": header,
        "processes": processes,
    }
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
