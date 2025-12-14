"""
Generic system metrics readers.

This module contains low-level helpers to read global system metrics
directly from the Linux /proc filesystem. These metrics are not related
to specific processes (PIDs) and are meant to be aggregated later by
higher-level builders such as the system header or snapshots.
"""

import os
from typing import Dict

from app.modules.common.base import PROC_PATH


def read_uptime_seconds() -> float:
    """
    Read the system uptime in seconds.

    The value is obtained from /proc/uptime and represents the number
    of seconds since the system was last booted.
    """
    try:
        with (PROC_PATH / "uptime").open() as f:
            return float(f.readline().split()[0])
    except Exception:
        return 0.0


def read_load_average() -> Dict[str, float]:
    """
    Read system load averages.

    Returns the 1, 5 and 15 minute load averages as reported by
    /proc/loadavg.
    """
    try:
        with (PROC_PATH / "loadavg").open() as f:
            one, five, fifteen, *_ = f.readline().split()
            return {
                "load_1m": float(one),
                "load_5m": float(five),
                "load_15m": float(fifteen),
            }
    except Exception:
        return {
            "load_1m": 0.0,
            "load_5m": 0.0,
            "load_15m": 0.0,
        }


def read_tasks_summary_named() -> Dict[str, int]:
    """
    Read a summary of system tasks grouped by human-readable state.

    The process state is read from /proc/<pid>/stat and mapped to
    aggregated categories similar to those shown by the `top` command.
    """
    state_counts: Dict[str, int] = {}

    for pid in os.listdir(PROC_PATH):
        if not pid.isdigit():
            continue

        try:
            with (PROC_PATH / pid / "stat").open() as f:
                state = f.readline().split()[2]

            state_counts[state] = state_counts.get(state, 0) + 1
        except Exception:
            continue

    return {
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
