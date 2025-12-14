"""
Top-like header builder for process views.
"""

from typing import Dict, Any

from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import (
    read_memory_info,
    read_memory_and_swap_status,
)
from app.modules.system.metrics import (
    read_uptime_seconds,
    read_load_average,
    read_tasks_summary_named,
)


def get_system_uptime_formatted() -> str:
    """
    Return system uptime formatted like top (DD days, HH:MM).
    """
    uptime = int(read_uptime_seconds())

    days = uptime // 86400
    hours = (uptime % 86400) // 3600
    minutes = (uptime % 3600) // 60

    if days > 0:
        return f"{days} days, {hours:02d}:{minutes:02d}"
    return f"{hours:02d}:{minutes:02d}"


def build_processes_header() -> Dict[str, Any]:
    """
    Build a top-like header to be used together with process tables.
    """
    return {
        "uptime": get_system_uptime_formatted(),
        "load_average": read_load_average(),
        "tasks": read_tasks_summary_named(),
        "cpu": get_cpu_global_top_percent(),
        "memory": read_memory_info(),
        "memory_status": read_memory_and_swap_status(),
    }
