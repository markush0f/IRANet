"""
System metrics collection and reporting.
"""

from pathlib import Path
from typing import Dict, Any
import time


PROC_PATH = Path("/proc")


def read_cpu_stat() -> Dict[str, Any]:
    """
    Read aggregated CPU statistics from ``/proc/stat``.

    It reads the first line corresponding to the CPU, extracts the first
    seven numeric fields and computes the total and idle CPU time in
    jiffies.

    Returns:
        Dict[str, Any]: Dictionary with the accumulated total time under
        the key ``"total"`` and the idle time under the key ``"idle"``.
    """
    with (PROC_PATH / "stat").open() as f:
        parts = f.readline().split()

    values = list(map(int, parts[1:8]))
    total = sum(values)
    idle = values[3]

    return {"total": total, "idle": idle}


def read_memory_info() -> Dict[str, Any]:
    """
    Retrieve system memory information from ``/proc/meminfo``.

    It iterates over all lines of the file, building a dictionary with
    the numeric values (in kilobytes) reported by the kernel, and then
    computes total, used and available memory.

    Returns:
        Dict[str, Any]: Dictionary with the keys ``"total_kb"``,
        ``"used_kb"`` and ``"free_kb"``, representing respectively total,
        used and free memory in kilobytes.
    """
    meminfo = {}

    with (PROC_PATH / "meminfo").open() as f:
        for line in f:
            key, value = line.split(":")
            meminfo[key] = int(value.strip().split()[0])

    total = meminfo["MemTotal"]
    free = meminfo["MemAvailable"]

    used = total - free

    return {"total_kb": total, "used_kb": used, "free_kb": free}


def read_load_average() -> Dict[str, Any]:
    """
    Read the system load averages from ``/proc/loadavg``.

    It extracts the load averages for 1, 5 and 15 minutes and returns
    them as floating-point values.

    Returns:
        Dict[str, Any]: Dictionary with the keys ``"1m"``, ``"5m"`` and
        ``"15m"`` representing the load averages over those intervals.
    """
    with (PROC_PATH / "loadavg").open() as f:
        one, five, fifteen, *_ = f.read().split()

    return {"1m": float(one), "5m": float(five), "15m": float(fifteen)}


def read_uptime() -> float:
    """
    Get the system uptime from ``/proc/uptime``.

    It reads the first value in the file, which indicates the number of
    seconds elapsed since the system was last booted.

    Returns:
        float: System uptime in seconds.
    """
    with (PROC_PATH / "uptime").open() as f:
        uptime_seconds = float(f.read().split()[0])

    return uptime_seconds


def get_system_metrics() -> Dict[str, Any]:
    """
    Collect and aggregate basic system metrics.

    It combines CPU, memory, load average and uptime metrics together
    with a UNIX timestamp representing when the metrics were read.

    Returns:
        Dict[str, Any]: Dictionary containing the keys ``"cpu"``,
        ``"memory"``, ``"load"``, ``"uptime_seconds"`` and ``"timestamp"``
        with the corresponding system metrics.
    """
    return _unit_metrics_json()


def _unit_metrics_json():
    """
    Unit test helper to get system metrics as JSON.

    Returns:
    - CPU:
        ~ total: Total CPU time ticks since system boot
        ~ idle: Idle CPU time ticks since system boot
    - Memory:
        ~ total_kb: Total system memory in KB
        ~ used_kb: Used system memory in KB
        ~ free_kb: Available system memory in KB
    - Load:
        ~ 1m: Load average over 1 minute
        ~ 5m: Load average over 5 minutes
        ~ 15m: Load average over 15 minutes
    - Uptime:
        ~ uptime_seconds: System uptime in seconds
    - Meta:
        ~ timestamp: Unix timestamp when metrics were collected
    """

    cpu = read_cpu_stat()
    memory = read_memory_info()
    load = read_load_average()
    uptime = read_uptime()

    return {
        "cpu": cpu,
        "memory": memory,
        "load": load,
        "uptime_seconds": uptime,
        "timestamp": int(time.time()),
    }
