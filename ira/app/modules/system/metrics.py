"""
System metrics collection and reporting.
"""

from pathlib import Path
from typing import Dict, Any
import time

from app.core.logger import get_logger
from app.modules.common.base import PROC_PATH
from app.modules.system.meminfo import read_memory_and_swap_status, read_memory_info


logger = get_logger(__name__)



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
    logger.debug("Reading CPU statistics from %s", PROC_PATH / "stat")

    with (PROC_PATH / "stat").open() as f:
        parts = f.readline().split()

    values = list(map(int, parts[1:8]))
    total = sum(values)
    idle = values[3]

    logger.debug("CPU stats read: total=%s idle=%s", total, idle)

    return {"total": total, "idle": idle}




def read_load_average() -> Dict[str, Any]:
    """
    Read the system load averages from ``/proc/loadavg``.

    It extracts the load averages for 1, 5 and 15 minutes and returns
    them as floating-point values.

    Returns:
        Dict[str, Any]: Dictionary with the keys ``"1m"``, ``"5m"`` and
        ``"15m"`` representing the load averages over those intervals.
    """
    logger.debug("Reading load average from %s", PROC_PATH / "loadavg")

    with (PROC_PATH / "loadavg").open() as f:
        one, five, fifteen, *_ = f.read().split()

    load = {"1m": float(one), "5m": float(five), "15m": float(fifteen)}

    logger.debug("Load averages read: %s", load)

    return load


def read_uptime() -> float:
    """
    Get the system uptime from ``/proc/uptime``.

    It reads the first value in the file, which indicates the number of
    seconds elapsed since the system was last booted.

    Returns:
        float: System uptime in seconds.
    """
    logger.debug("Reading system uptime from %s", PROC_PATH / "uptime")

    with (PROC_PATH / "uptime").open() as f:
        uptime_seconds = float(f.read().split()[0])

    logger.debug("System uptime read: %s seconds", uptime_seconds)

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

    logger.info("Collecting system metrics")

    cpu = read_cpu_stat()
    memory_basic = read_memory_info()
    load = read_load_average()
    uptime = read_uptime()
    memory_extended = read_memory_and_swap_status()

    metrics = {
        "cpu": cpu,
        "memory": memory_basic,
        "memory_status": memory_extended,
        "load": load,
        "uptime_seconds": uptime,
        "timestamp": int(time.time()),
    }

    logger.debug("System metrics collected: %s", metrics)

    return metrics

