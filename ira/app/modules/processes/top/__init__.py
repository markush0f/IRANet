from typing import Dict, Any, List

from .cpu import get_top_processes, get_top_cpu_processes
from .memory import get_top_memory_processes


def get_processes_summary(limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
    """
    Aggregate processes information from CPU and memory perspectives.

    Returns a dict with top processes by CPU and by memory so it can be
    easily consumed by a higher-level service or API.
    """
    return {
        "top_cpu": get_top_cpu_processes(limit),
        "top_memory": get_top_memory_processes(limit),
    }


__all__ = [
    "get_top_processes",
    "get_top_cpu_processes",
    "get_top_memory_processes",
    "get_processes_summary",
]
