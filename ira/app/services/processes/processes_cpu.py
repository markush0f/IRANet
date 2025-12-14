"""CPU-related services for running processes.

This module provides high-level helpers built on top of
``app.modules.processes.top.cpu`` and ``app.modules.processes.top.time``.
"""

from app.common.TIME_TYPES import TimeType
from app.core.logger import get_logger

from app.modules.processes.top.time import (
    get_process_cpu_time_ticks,
    get_process_cpu_time_seconds,
    get_process_cpu_time_milliseconds,  
    get_process_cpu_time_minutes,
    get_process_cpu_time_hours,
    get_process_cpu_time_formatted,
)
from app.modules.system.cpu import get_cpu_global_top_percent

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
    return get_cpu_global_top_percent(limit)


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


