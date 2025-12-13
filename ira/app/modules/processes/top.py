"""
programmatic equivalent of the Linux top command
"""

import os
from pathlib import Path
from typing import List, Dict, Any
import time

PROC_PATH = Path("/proc")
CLK_TCK = 100  # Linux default


def _read_total_cpu_time() -> int:
    """Read the total CPU time from /proc/stat in ticks."""
    with (PROC_PATH / "stat").open() as f:
        parts = f.readline().split()
    return sum(map(int, parts[1:8]))


def _read_process_cpu_time(pid: str) -> int:
    """
    Read the CPU time consumed by a specific process.

    :param pid: Process identifier as a string.
    :return: Sum of user and system time (ticks).
    """
    with (PROC_PATH / pid / "stat").open() as f:
        parts = f.readline().split()
    utime = int(parts[13])
    stime = int(parts[14])
    return utime + stime


def _read_process_memory(pid: str) -> int:
    """
    Get the resident memory (RAM) used by a process.

    :param pid: Process identifier as a string.
    :return: Memory in kilobytes, or 0 if not found.
    """
    with (PROC_PATH / pid / "status").open() as f:
        for line in f:
            if line.startswith("VmRSS:"):
                return int(line.split()[1])
    return 0


def _read_process_name(pid: str) -> str:
    """
    Read the process name from /proc/<pid>/comm.

    :param pid: Process identifier as a string.
    :return: Process name or 'unknown' on failure.
    """
    try:
        return (PROC_PATH / pid / "comm").read_text().strip()
    except Exception:
        return "unknown"


def get_top_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get the processes with the highest CPU usage in a short interval.

    Calculates CPU percentage and memory used for each process, sorts by CPU
    usage in descending order and returns the first ones.

    CPU usage is calculated using two snapshots of accumulated CPU counters:
    values read from /proc are cumulative since system or process start, so
    the actual CPU usage is derived from the difference between two readings
    taken in a short time window.

    :param limit: Maximum number of processes to return.
    :return: List of dicts with pid, name, cpu_percent and memory_kb.
    """
    # accumulated CPU
    # /proc provides cumulative CPU counters since boot (system) or process start.
    # To calculate real CPU usage, two snapshots are taken and the delta between
    # them represents the CPU consumed during this short interval.
    snapshot_1 = {}
    total_cpu_1 = _read_total_cpu_time()

    # keeps only entries that are numbers (PIDs)
    for pid in filter(str.isdigit, os.listdir(PROC_PATH)):
        try:
            snapshot_1[pid] = _read_process_cpu_time(pid)
        except Exception:
            continue

    # wait 100 ms to measure differences between snapshot 1 and snapshot 2
    time.sleep(0.1)

    # save CPU per process at the second instant
    snapshot_2 = {}
    total_cpu_2 = _read_total_cpu_time()

    # avoid “new processes” that appear later (so that the calculation is consistent)
    for pid in snapshot_1:
        try:
            snapshot_2[pid] = _read_process_cpu_time(pid)
        except Exception:
            continue

    # calculate how much the total system CPU counter “advanced” during the interval
    total_delta = total_cpu_2 - total_cpu_1

    processes = []

    for pid, cpu_1 in snapshot_1.items():
        cpu_2 = snapshot_2.get(pid)
        if cpu_2 is None:
            continue

        # amount of CPU consumed by that process during the interval
        cpu_delta = cpu_2 - cpu_1
        if cpu_delta <= 0 or total_delta <= 0:
            continue

        cpu_percent = round((cpu_delta / total_delta) * 100, 2)

        processes.append(
            {
                "pid": int(pid),
                "name": _read_process_name(pid),
                "cpu_percent": cpu_percent,
                "memory_kb": _read_process_memory(pid),
            }
        )

    processes.sort(key=lambda p: p["cpu_percent"], reverse=True)
    return processes[:limit]
