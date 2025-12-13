"""Get all information of top processes."""

from app.modules.processes.top.memory import get_top_memory_processes
from app.modules.processes.top.cpu import get_top_cpu_processes
from app.modules.processes.top.info import (
    get_process_state,
    get_process_state_extended,
    get_process_user,
)


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


def get_process_user_info(pid: str) -> str:
    """Return the username that owns the given process."""
    return get_process_user(pid)


def get_process_state_info(pid: str) -> str:
    """Return the current STAT of the given process."""
    state = get_process_state(pid)
    return get_process_state_extended(state)
