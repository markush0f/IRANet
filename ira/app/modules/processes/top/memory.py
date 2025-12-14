"""
Memory-related process metrics, based on the Linux ``/proc`` filesystem.

All helpers in this module read process memory information directly
from ``/proc/<pid>`` entries and expose it in kilobytes.
"""

import os
from typing import List, Dict, Any

from app.modules.common.TOP_MEMORY_FIELDS import TOP_MEMORY_FIELDS

from .base import PROC_PATH, iter_pids, read_process_memory, read_process_name

PAGE_SIZE_KB = os.sysconf("SC_PAGE_SIZE") // 1024


def get_top_memory_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get the processes with the highest resident memory usage.

    For each process under ``/proc`` that has a positive resident
    memory value, this function collects its PID, name and memory in
    kilobytes and then returns the top consumers.

    :param limit: Maximum number of processes to return (sorted
        descending by memory usage).
    :return: List of dictionaries with keys ``\"pid\"`` (int),
        ``\"name\"`` (str) and ``\"memory_kb\"`` (int).
    """
    processes = []

    for pid in iter_pids():
        try:
            memory_kb = read_process_memory(pid)
        except Exception:
            continue

        if memory_kb <= 0:
            continue

        processes.append(
            {
                "pid": int(pid),
                "name": read_process_name(pid),
                "memory_kb": memory_kb,
            }
        )

    processes.sort(key=lambda p: p["memory_kb"], reverse=True)
    return processes[:limit]


def get_process_memory_virt_kb(pid: str) -> int:
    """
    Return the virtual memory size (VIRT) of the process in KB.

    The value is read from ``/proc/<pid>/statm`` (first field) and
    converted from pages to kilobytes using the system page size.

    :param pid: Process identifier as a string.
    :return: Virtual memory size in kilobytes, or ``0`` on failure.
    """
    try:
        with (PROC_PATH / pid / "statm").open() as f:
            parts = f.readline().split()
            return int(parts[0]) * PAGE_SIZE_KB
    except Exception:
        return 0


def get_process_memory_shared_kb(pid: str) -> int:
    """
    Return the shared memory size (SHR) of the process in KB.

    The value is read from ``/proc/<pid>/statm`` (third field) and
    converted from pages to kilobytes using the system page size.

    :param pid: Process identifier as a string.
    :return: Shared memory size in kilobytes, or ``0`` on failure.
    """
    try:
        with (PROC_PATH / pid / "statm").open() as f:
            parts = f.readline().split()
            return int(parts[2]) * PAGE_SIZE_KB
    except Exception:
        return 0


def get_process_memory_res_kb(pid: str) -> int:
    """
    Return the resident memory (RES) of the process in KB.

    The value is taken from the ``VmRSS`` entry in
    ``/proc/<pid>/status``.

    :param pid: Process identifier as a string.
    :return: Resident memory in kilobytes, or ``0`` if it cannot be
        determined.
    """
    try:
        with (PROC_PATH / pid / "status").open() as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    return int(line.split()[1])
    except Exception:
        pass

    return 0





