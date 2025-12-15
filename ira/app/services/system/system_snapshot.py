from typing import Dict, Any
import time

from app.modules.system.proc import (
    read_uptime_seconds,
    read_load_average,
    read_tasks_summary_named,
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

    This function composes low-level system metrics into a single,
    stable JSON structure similar to the Linux `top` header.
    """
    timestamp = int(time.time())

    uptime_seconds = int(read_uptime_seconds())
    load = read_load_average()
    tasks = read_tasks_summary_named()
    cpu = get_cpu_global_top_percent()
    memory_status = read_memory_and_swap_status()

    alerts = {
        "high_load": load["load_1m"] > (cpu["cores"] if "cores" in cpu else 1),
        "memory_pressure": memory_status["memory"]["pressure"] != "ok",
        "swap_active": memory_status["swap"]["state"] == "active",
    }

    return {
        "timestamp": timestamp,
        "uptime": {
            "seconds": uptime_seconds,
            "formatted": _format_uptime(uptime_seconds),
        },
        "load": load,
        "tasks": tasks,
        "cpu": cpu,
        "memory": memory_status["memory"],
        "swap": memory_status["swap"],
        "alerts": alerts,
    }
