"""High-level services to inspect running processes.

This module acts as a façade over the low-level helpers in
``app.modules.processes.top`` (CPU, memory, state and time). It exposes
functions that are convenient for the API layer and for other
application components.
"""

from app.common.TIME_TYPES import TimeType
from app.core.logger import get_logger

from app.modules.processes.top.cpu import get_top_cpu_processes
from app.modules.processes.top.memory import (
    get_top_memory_processes,
    get_process_memory_virt_kb,
    get_process_memory_res_kb,
    get_process_memory_shared_kb,
)
from app.modules.processes.top.system import get_total_memory_kb
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
    get_process_cpu_time_formatted,
)

logger = get_logger(__name__)


def list_top_cpu_processes(limit: int = 5):
    """
    Return the processes that are currently using more CPU.

    This is a thin wrapper around
    :func:`app.modules.processes.top.cpu.get_top_cpu_processes`.

    :param limit: Maximum number of processes to return.
    :return: Iterable of process dictionaries as provided by the
        underlying helper.
    """
    logger.info("Listing top CPU processes (limit=%d)", limit)
    return get_top_cpu_processes(limit)


def get_processes_overview(limit: int = 5):
    """
    Get an overview of the most CPU- and memory-intensive processes.

    The result groups the output of ``top``-like helpers into a single
    structure suitable for JSON responses.

    :param limit: Maximum number of processes to include in each list.
    :return: Dictionary with ``\"top_cpu_processes\"`` and
        ``\"top_memory_processes\"`` keys.
    """
    logger.info("Getting processes overview (limit=%d)", limit)
    return {
        "top_cpu_processes": list_top_cpu_processes(limit),
        "top_memory_processes": get_top_memory_processes(limit),
    }


def get_process_user_info(pid: str) -> str:
    """
    Return the username that owns the given process.

    :param pid: Process identifier as a string.
    :return: Username associated with the process, or ``\"unknown\"``
        if it cannot be resolved.
    """
    logger.debug("Getting user info for pid %s", pid)
    return get_process_user(pid)


def get_process_state_label(pid: str) -> str:
    """
    Return a human-readable label for the process state.

    :param pid: Process identifier as a string.
    :return: Description of the process state (for example
        ``\"Running\"`` or ``\"Sleeping\"``), or ``\"Unknown\"``.
    """
    logger.debug("Getting state label for pid %s", pid)
    state = get_process_state(pid)
    return get_state_label(state)


def get_process_stat_field(pid: str) -> str:
    """
    Build the short STAT field as shown by tools like ``top``.

    The returned value combines the base process state (R, S, D, etc.)
    with additional flags such as multithreaded, nice priority and
    session leader.

    :param pid: Process identifier as a string.
    :return: STAT field string (for example ``\"R<N\"``) or ``\"?\"``
        if the state cannot be determined.
    """
    logger.debug("Building STAT field for pid %s", pid)
    state = get_process_state(pid)
    if state == "?":
        return "?"

    flags: list[str] = []

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
    Return a list of extended STAT descriptions for a process.

    This breaks down the short STAT field into human-readable phrases
    such as ``\"Running\"``, ``\"Multithreaded\"`` or ``\"Session leader\"``.

    :param pid: Process identifier as a string.
    :return: List of textual descriptions, or ``[\"Unknown\"]`` if the
        state cannot be determined.
    """
    logger.debug("Building extended STAT info for pid %s", pid)
    descriptions: list[str] = []

    state = get_process_state(pid)
    if state == "?":
        return ["Unknown"]

    descriptions.append(get_state_label(state))

    if get_process_threads(pid) > 1:
        descriptions.append("Multithreaded")

    nice = get_process_nice(pid)
    if nice < 0:
        descriptions.append("High priority")
    elif nice > 0:
        descriptions.append("Low priority")

    if get_process_session_id(pid) == int(pid):
        descriptions.append("Session leader")

    return descriptions


def get_process_cpu_time(pid: str, tyme_type: TimeType = TimeType.TICKS) -> float | str:
    """
    Return the CPU time consumed by a process in the requested format.

    :param pid: Process identifier as a string.
    :param tyme_type: Target representation (ticks, seconds, minutes,
        hours, milliseconds or formatted string).
    :return: CPU time as a numeric value or a preformatted string,
        depending on ``tyme_type``.
    :raises ValueError: If an unsupported time type is provided.
    """
    logger.debug("Getting CPU time for pid %s with type %s", pid, tyme_type)

    if tyme_type == TimeType.TICKS:
        return get_process_cpu_time_ticks(pid)
    if tyme_type == TimeType.SECONDS:
        return get_process_cpu_time_seconds(pid)
    if tyme_type == TimeType.MILLISECONDS:
        return get_process_cpu_time_milliseconds(pid)
    if tyme_type == TimeType.MINUTES:
        return get_process_cpu_time_minutes(pid)
    if tyme_type == TimeType.HOURS:
        return get_process_cpu_time_hours(pid)
    if tyme_type == TimeType.FORMATTED:
        return get_process_cpu_time_formatted(pid)

    raise ValueError(f"Unsupported time type: {tyme_type}")


def get_process_ppid_info(pid: str) -> int:
    """
    Return the parent process ID (PPID) for a given process.

    :param pid: Process identifier as a string.
    :return: Parent process ID, or ``-1`` if it cannot be determined.
    """
    return get_process_ppid(pid)


def get_process_priority_info(pid: str) -> int:
    """
    Return the scheduling priority (PRI) for a process.

    :param pid: Process identifier as a string.
    :return: Priority value, or ``-1`` if it cannot be determined.
    """
    logger.debug("Getting priority info for pid %s", pid)
    return get_process_priority(pid)


def get_process_nice_info(pid: str) -> int:
    """
    Return the nice value of a process.

    :param pid: Process identifier as a string.
    :return: Nice value, or ``0`` if it cannot be determined.
    """
    logger.debug("Getting nice info for pid %s", pid)
    return get_process_nice(pid)


def get_process_memory_virt(pid: str) -> int:
    """
    Return the virtual memory (VIRT) used by a process in kilobytes.

    :param pid: Process identifier as a string.
    :return: Virtual memory size in KB, or ``0`` on failure.
    """
    return get_process_memory_virt_kb(pid)


def get_process_memory_res(pid: str) -> int:
    """
    Return the resident memory (RES) used by a process in kilobytes.

    :param pid: Process identifier as a string.
    :return: Resident memory size in KB, or ``0`` on failure.
    """
    return get_process_memory_res_kb(pid)


def get_process_memory_shared(pid: str) -> int:
    """
    Return the shared memory (SHR) used by a process in kilobytes.

    :param pid: Process identifier as a string.
    :return: Shared memory size in KB, or ``0`` on failure.
    """
    return get_process_memory_shared_kb(pid)


def get_process_memory_percent(pid: str) -> float:
    """
    Return the memory usage of a process as a percentage of total RAM.

    :param pid: Process identifier as a string.
    :return: Memory usage percentage, rounded to two decimal places, or
        ``0.0`` if the total memory cannot be determined.
    """
    total_mem = get_total_memory_kb()
    if total_mem <= 0:
        return 0.0

    res_kb = get_process_memory_res_kb(pid)
    return round((res_kb / total_mem) * 100, 2)
