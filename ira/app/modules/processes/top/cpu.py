"""
CPU-related process metrics, based on Linux /proc.
"""

from typing import List, Dict, Any
import time

from app.modules.processes.top.time import get_process_cpu_time_ticks

from .base import (
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
            snapshot_1[pid] = get_process_cpu_time_ticks(pid)
        except Exception:
            continue

    # wait 100 ms to measure differences between snapshot 1 and snapshot 2
    time.sleep(0.1)

    snapshot_2 = {}
    total_cpu_2 = _read_total_cpu_time()

    # avoid “new processes” that appear later (so that the calculation is consistent)
    for pid in snapshot_1:
        try:
            snapshot_2[pid] = get_process_cpu_time_ticks(pid)
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


def _read_cpu_stat() -> dict[str, int]:
    """
    Read raw CPU counters from /proc/stat (aggregate 'cpu' line).
    """
    with (PROC_PATH / "stat").open() as f:
        parts = f.readline().split()

    return {
        "user": int(parts[1]),
        "nice": int(parts[2]),
        "system": int(parts[3]),
        "idle": int(parts[4]),
        "iowait": int(parts[5]),
        "irq": int(parts[6]),
        "softirq": int(parts[7]),
        "steal": int(parts[8]) if len(parts) > 8 else 0,
    }


def get_cpu_global_top_percent(interval: float = 0.1) -> dict[str, float]:
    """
    Return global CPU usage percentages (top-like).
    """
    snap1 = _read_cpu_stat()
    time.sleep(interval)
    snap2 = _read_cpu_stat()

    deltas = {k: snap2[k] - snap1[k] for k in snap1}
    total = sum(deltas.values())

    if total <= 0:
        return {
            "us": 0.0,
            "sy": 0.0,
            "ni": 0.0,
            "id": 0.0,
            "wa": 0.0,
            "hi": 0.0,
            "si": 0.0,
            "st": 0.0,
        }

    return {
        "us": round((deltas["user"] / total) * 100, 2),
        "ni": round((deltas["nice"] / total) * 100, 2),
        "sy": round((deltas["system"] / total) * 100, 2),
        "id": round((deltas["idle"] / total) * 100, 2),
        "wa": round((deltas["iowait"] / total) * 100, 2),
        "hi": round((deltas["irq"] / total) * 100, 2),
        "si": round((deltas["softirq"] / total) * 100, 2),
        "st": round((deltas["steal"] / total) * 100, 2),
    }
