"""
System-wide memory information helpers.
"""

import os

from app.modules.common.base import PROC_PATH
from app.modules.system.meminfo import get_total_memory



def get_total_memory_kb() -> int:
    """
    Return total system memory in kilobytes.

    This is a convenience wrapper around :func:`get_total_memory` that
    always returns the value in kilobytes.
    """
    return get_total_memory("kb")


def get_total_memory_mb() -> int:
    """
    Return total system memory in megabytes.

    This is a convenience wrapper around :func:`get_total_memory` that
    always returns the value in megabytes.
    """
    return get_total_memory("mb")


def get_total_memory_gb() -> int:
    """
    Return total system memory in gigabytes.

    This is a convenience wrapper around :func:`get_total_memory` that
    always returns the value in gigabytes.
    """
    return get_total_memory("gb")


def get_system_uptime_seconds() -> float:
    """
    Return system uptime in seconds.
    """
    try:
        with (PROC_PATH / "uptime").open() as f:
            return float(f.readline().split()[0])
    except Exception:
        return 0.0


def get_load_average() -> dict:
    """
    Return system load average for 1, 5 and 15 minutes.
    <1min> <5min> <15min> <running/total> <last_pid>

    """
    try:
        with (PROC_PATH / "loadavg").open() as f:
            parts = f.readline().split()
            return {
                "load_1m": float(parts[0]),
                "load_5m": float(parts[1]),
                "load_15m": float(parts[2]),
            }
    except Exception:
        return {
            "load_1m": 0.0,
            "load_5m": 0.0,
            "load_15m": 0.0,
        }


def get_tasks_summary_by_state_code() -> dict[str, int]:
    """
    Return a summary of system tasks grouped by raw STAT code.
    """
    summary = {}

    for pid in os.listdir(PROC_PATH):
        if not pid.isdigit():
            continue

        try:
            with (PROC_PATH / pid / "stat").open() as f:
                state = f.readline().split()[2]

            summary[state] = summary.get(state, 0) + 1

        except Exception:
            continue

    return summary


def get_tasks_summary_named() -> dict[str, int]:
    """
    Return a summary of system tasks grouped by human-readable state.
    """
    state_counts = get_tasks_summary_by_state_code()

    summary = {
        "total": sum(state_counts.values()),
        "running": state_counts.get("R", 0),
        "sleeping": (
            state_counts.get("S", 0)
            + state_counts.get("D", 0)
            + state_counts.get("I", 0)
        ),
        "stopped": state_counts.get("T", 0),
        "zombie": state_counts.get("Z", 0),
    }

    return summary
