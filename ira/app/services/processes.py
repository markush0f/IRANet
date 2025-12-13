"""Get all information of top processes."""

from app.modules.processes.top.memory import get_top_memory_processes
from app.modules.processes.top.cpu import get_top_cpu_processes
from app.modules.processes.top.state import (
    get_process_nice,
    get_process_session_id,
    get_process_state,
    get_process_state_extended,
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
    """Return the current STAT of the given process."""
    state = get_process_state(pid)
    return get_process_state_extended(state)


def get_process_stat_field(pid: str) -> str:
    """
    Build the STAT field for a process, emulating top behavior.
    """
    state = get_process_state(pid)
    if state == "?":
        return "?"

    flags = []

    # Multithreaded flag
    threads = get_process_threads(pid)
    if threads > 1:
        flags.append("l")

    # Priority flags based on nice value
    nice = get_process_nice(pid)
    if nice < 0:
        flags.append("<")
    elif nice > 0:
        flags.append("N")

    # Session leader flag
    sid = get_process_session_id(pid)
    if sid == int(pid):
        flags.append("s")

    return state + "".join(flags)

def get_process_stat_extended(pid: str) -> list[str]:
    """
    Return the human-readable STAT information for a process.
    This includes the base state and all applicable flags,
    fully explained (no single-letter codes).
    """
    descriptions = []

    # Base process state
    state = get_process_state(pid)
    if state == "?":
        return ["Unknown"]

    descriptions.append(get_process_state_extended(state))

    # Multithreaded
    threads = get_process_threads(pid)
    if threads > 1:
        descriptions.append("Multithreaded")

    # Priority
    nice = get_process_nice(pid)
    if nice < 0:
        descriptions.append("High priority")
    elif nice > 0:
        descriptions.append("Low priority")

    # Session leader
    sid = get_process_session_id(pid)
    if sid == int(pid):
        descriptions.append("Session leader")

    return descriptions
