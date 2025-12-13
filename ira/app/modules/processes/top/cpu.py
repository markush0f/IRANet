"""
CPU-related process metrics, based on Linux /proc.
"""

from typing import List, Dict, Any
import time

from app.modules.processes.top.time import get_process_cpu_time

from .base import (
    CLK_TCK,
    PROC_PATH,
    iter_pids,
    read_process_memory,
    read_process_name,
)


def _read_total_cpu_time() -> int:
    """Read the total CPU time from /proc/stat in ticks."""
    with (PROC_PATH / "stat").open() as f:
        parts = f.readline().split()
    return sum(map(int, parts[1:8]))


def get_top_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get the processes with the highest CPU usage in a short interval.

    Calculates CPU percentage and memory used for each process, sorts by CPU
    usage in descending order and returns the first ones.
    """
    snapshot_1 = {}
    total_cpu_1 = _read_total_cpu_time()

    # keeps only entries that are numbers (PIDs)
    for pid in iter_pids():
        try:
            snapshot_1[pid] = get_process_cpu_time(pid)
        except Exception:
            continue

    # wait 100 ms to measure differences between snapshot 1 and snapshot 2
    time.sleep(0.1)

    snapshot_2 = {}
    total_cpu_2 = _read_total_cpu_time()

    # avoid “new processes” that appear later (so that the calculation is consistent)
    for pid in snapshot_1:
        try:
            snapshot_2[pid] = get_process_cpu_time(pid)
        except Exception:
            continue

    total_delta = total_cpu_2 - total_cpu_1

    processes: List[Dict[str, Any]] = []

    for pid, cpu_1 in snapshot_1.items():
        cpu_2 = snapshot_2.get(pid)
        if cpu_2 is None:
            continue

        cpu_delta = cpu_2 - cpu_1
        if cpu_delta <= 0 or total_delta <= 0:
            continue

        cpu_percent = round((cpu_delta / total_delta) * 100, 2)

        processes.append(
            {
                "pid": int(pid),
                "name": read_process_name(pid),
                "cpu_percent": cpu_percent,
                "memory_kb": read_process_memory(pid),
            }
        )

    processes.sort(key=lambda p: p["cpu_percent"], reverse=True)
    return processes[:limit]


def get_top_cpu_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Alias for get_top_processes kept for clarity when importing CPU-specific data.
    """
    return get_top_processes(limit)
