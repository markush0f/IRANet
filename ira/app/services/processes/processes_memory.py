"""Memory-related services for running processes.

This module exposes high-level helpers around memory usage based on the
``app.modules.processes.top.memory`` and ``app.modules.processes.top.system``
modules.
"""

from app.core.logger import get_logger

from app.modules.processes.top.memory import (
    get_top_memory_processes,
    get_process_memory_virt_kb,
    get_process_memory_res_kb,
    get_process_memory_shared_kb,
)
from app.modules.system.header import get_total_memory_kb
from app.modules.system.meminfo import read_memory_info

logger = get_logger(__name__)


def list_top_memory_processes(limit: int = 5):
    """
    Return the processes that use more resident memory.

    :param limit: Maximum number of processes to return.
    :return: List of process dictionaries as returned by
        :func:`get_top_memory_processes`.
    """
    logger.info("Listing top memory processes (limit=%d)", limit)
    return get_top_memory_processes(limit)


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
        ``0.0`` if the total memory cannot be determined.`
    """
    total_mem = get_total_memory_kb()
    if total_mem <= 0:
        return 0.0

    res_kb = get_process_memory_res_kb(pid)
    return round((res_kb / total_mem) * 100, 2)


def get_memory_info() -> dict[str, int]:
    """
    Return system memory information.
    """
    return read_memory_info()
