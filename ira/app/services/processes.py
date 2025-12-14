"""Get all information of top processes."""

from app.common.TIME_TYPES import TimeType
from app.core.logger import get_logger
from app.modules.processes.top.memory import get_top_memory_processes
from app.modules.processes.top.cpu import get_top_cpu_processes
from app.modules.processes.top.state import (
    get_process_nice,
    get_process_ppid,
    get_process_priority,
    get_process_session_id,
    get_process_state,
    get_process_state_extended as get_state_label,
    get_process_threads,
    get_process_user,
)
from app.modules.processes.top.time import (
        get_process_cpu_time_ticks,
        get_process_cpu_time_seconds,
        get_process_cpu_time_milliseconds,
        get_process_cpu_time_minutes,
        get_process_cpu_time_hours,
        get_process_cpu_time_formatted
    )


logger = get_logger(__name__)

def list_top_cpu_processes(limit: int = 5):
    logger.info("Listing top CPU processes (limit=%d)", limit)
    return get_top_cpu_processes(limit)


def get_processes_overview(limit: int = 5):
    """Get an overview of top processes by CPU and memory usage."""
    logger.info("Getting processes overview (limit=%d)", limit)
    cpu_top = list_top_cpu_processes(limit)
    memory_top = get_top_memory_processes(limit)

    return {
        "top_cpu_processes": cpu_top,
        "top_memory_processes": memory_top,
    }


def get_process_user_info(pid: str) -> str:
    """Return the username that owns the given process."""
    logger.debug("Getting user info for pid %s", pid)
    return get_process_user(pid)


def get_process_state_label(pid: str) -> str:
    """Return the human-readable base state of the process."""
    logger.debug("Getting state label for pid %s", pid)
    state = get_process_state(pid)
    return get_state_label(state)


def get_process_stat_field(pid: str) -> str:
    """
    Build the compact STAT field for a process (top-like).
    Example: Sl, R<, Ss
    """
    logger.debug("Building STAT field for pid %s", pid)
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
    logger.debug("Building extended STAT info for pid %s", pid)
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

def get_process_cpu_time(pid: str, tyme_type: TimeType = TimeType.TICKS) -> float | str:
    """
    Read the CPU time consumed by a specific process.
    """
    logger.debug("Getting CPU time for pid %s with type %s", pid, tyme_type)

    if tyme_type == TimeType.TICKS:
        return get_process_cpu_time_ticks(pid)
    elif tyme_type == TimeType.SECONDS:
        return get_process_cpu_time_seconds(pid)
    elif tyme_type == TimeType.MILLISECONDS:
        return get_process_cpu_time_milliseconds(pid)
    elif tyme_type == TimeType.MINUTES:
        return get_process_cpu_time_minutes(pid)
    elif tyme_type == TimeType.HOURS:
        return get_process_cpu_time_hours(pid)
    elif tyme_type == TimeType.FORMATTED:
        return get_process_cpu_time_formatted(pid)
    else:
        raise ValueError(f"Unsupported time type: {tyme_type}")
    
    
def get_process_ppid_info(pid: str) -> int:
    """Return the parent PID of the process."""
    return get_process_ppid(pid)


def get_process_priority_info(pid: str) -> int:
    """Return the priority of the process."""
    logger.debug("Getting priority info for pid %s", pid)
    return get_process_priority(pid)

def get_process_nice_info(pid: str) -> int:
    """Return the nice value of the process."""
    logger.debug("Getting nice info for pid %s", pid)
    return get_process_nice(pid)