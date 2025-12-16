"""
Top-like header builder for process views.
"""

from typing import Dict, Any

from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import read_memory_and_swap_status
from app.modules.system.proc import (
    read_uptime_seconds,
    load_average,
    read_tasks_summary_named,
)


def _format_uptime(seconds: int) -> str:
    """
    Format system uptime like top (DD days, HH:MM).
    """
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60

    if days > 0:
        return f"{days} days, {hours:02d}:{minutes:02d}"
    return f"{hours:02d}:{minutes:02d}"


def build_processes_header() -> Dict[str, Any]:
    """
    Build a top-like header to be used together with process tables.
    """
    uptime_seconds = int(read_uptime_seconds())
    memory_status = read_memory_and_swap_status()

    return {
        "uptime": _format_uptime(uptime_seconds),
        "load_average": load_average(),
        "tasks": read_tasks_summary_named(),
        "cpu": get_cpu_global_top_percent(),
        "memory": memory_status["memory"],
        "swap": memory_status["swap"],
    }
