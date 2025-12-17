import os
from typing import Dict, Any
import time

from app.modules.processes.top.state import read_tasks_summary_named
from app.modules.processes.top.system import load_average
from app.modules.system.proc import (
    read_uptime_seconds,

)
from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import read_memory_and_swap_status


def _format_uptime(seconds: int) -> str:
    """
    Format uptime like top (DD days, HH:MM).
    """
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60

    if days > 0:
        return f"{days} days, {hours:02d}:{minutes:02d}"
    return f"{hours:02d}:{minutes:02d}"


def build_system_snapshot() -> Dict[str, Any]:
    """
    Build a full system snapshot suitable for frontend consumption.

    This snapshot represents a global overview of the system,
    similar to the header shown by the Linux `top` command.
    """
    timestamp = int(time.time())

    uptime_seconds = int(read_uptime_seconds())
    memory_status = read_memory_and_swap_status()

    return {
        "timestamp": timestamp,
        "uptime": {
            "seconds": uptime_seconds,
            "formatted": _format_uptime(uptime_seconds),
        },
        "load": load_average(),
        "tasks": read_tasks_summary_named(),
        "cpu": {
            "usage": get_cpu_global_top_percent(),
        },
        "memory": memory_status["memory"],
        "swap": memory_status["swap"],
    }


def build_system_resources_snapshot() -> Dict[str, Any]:
    """
    Build a lightweight system resources snapshot.

    This snapshot is optimized for frequent polling and real-time
    visualizations (CPU, memory and swap usage).
    """
    timestamp = int(time.time())
    memory_status = read_memory_and_swap_status()

    return {
        "timestamp": timestamp,
        "cpu": get_cpu_global_top_percent(),
        "memory": memory_status["memory"],
        "swap": memory_status["swap"],
    }



def build_system_alerts_snapshot() -> Dict[str, Any]:
    """
    Build a system alerts snapshot.

    This snapshot evaluates system metrics and exposes boolean flags
    so the frontend does not need to interpret raw values.
    """
    timestamp = int(time.time())

    load = load_average()
    memory_status = read_memory_and_swap_status()

    cpu_cores = os.cpu_count() or 1

    # If in 1 minute load average exceeds number of CPU cores, consider it high load
    high_load = load["load_1m"] > cpu_cores

    memory_pressure = memory_status["memory"]["pressure"] != "ok"
    swap_active = memory_status["swap"]["state"] == "active"

    return {
        "timestamp": timestamp,
        "alerts": {
            "high_load": high_load,
            "memory_pressure": memory_pressure,
            "swap_active": swap_active,
        },
    }
