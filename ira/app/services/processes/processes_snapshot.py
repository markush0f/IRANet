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
