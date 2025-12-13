"""Get all information of top processes."""

from app.modules.processes.top.memory import get_top_memory_processes
from app.modules.processes.top.cpu import get_top_cpu_processes
from app.modules.processes.top.state import (
    get_process_nice,
    get_process_session_id,
    get_process_state,
    get_process_state_extended as get_state_label,
    get_process_threads,
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


def get_process_state_label(pid: str) -> str:
    """Return the human-readable base state of the process."""
    state = get_process_state(pid)
    return get_state_label(state)


def get_process_stat_field(pid: str) -> str:
    """
    Build the compact STAT field for a process (top-like).
    Example: Sl, R<, Ss
    """
    state = get_process_state(pid)
    if state == "?":
        return "?"

    flags = []

    if get_process_threads(pid) > 1:
        flags.append("l")

    nice = get_process_nice(pid)
    if nice < 0:
        flags.append("<")
    elif nice > 0:
        flags.append("N")

    if get_process_session_id(pid) == int(pid):
        flags.append("s")

    return state + "".join(flags)


def get_process_stat_extended(pid: str) -> list[str]:
    """
    Return the fully human-readable STAT information for a process.
    No letters, only explanations.
    """
    descriptions = []

    state = get_process_state(pid)
    if state == "?":
        return ["Unknown"]

    # Base state
    descriptions.append(get_state_label(state))

    # Multithreaded
    if get_process_threads(pid) > 1:
        descriptions.append("Multithreaded")

    # Priority
    nice = get_process_nice(pid)
    if nice < 0:
        descriptions.append("High priority")
    elif nice > 0:
        descriptions.append("Low priority")

    # Session leader
    if get_process_session_id(pid) == int(pid):
        descriptions.append("Session leader")

    return descriptions
