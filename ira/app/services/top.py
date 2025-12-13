"""Get all information of top processes."""

from app.modules.processes.top.memory import get_top_memory_processes
from app.modules.processes.top.cpu import get_top_cpu_processes


def list_top_cpu_processes(limit: int = 5):
    return get_top_cpu_processes(limit)


def get_processes_overview(limit: int = 5):
    """Get an overview of top processes by CPU and memory usage."""
    cpu_top = list_top_cpu_processes(limit)
    memory_top = get_top_memory_processes(limit)

    return {
        "top_cpu_processes": cpu_top,
        "top_memory_processes": memory_top,
    }