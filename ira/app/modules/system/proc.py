"""
System-wide memory information helpers.
"""

import os
from app.modules.common.base import PROC_PATH
from typing import  List, Optional


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


def list_pids() -> List[str]:
    """
    List numeric process IDs from /proc.
    """
    try:
        return [p for p in os.listdir(PROC_PATH) if p.isdigit()]
    except Exception:
        return []


def read_process_stat(pid: str) -> Optional[str]:
    """
    Read raw /proc/<pid>/stat content.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return f.read()
    except Exception:
        return None


def read_process_cmdline(pid: str) -> List[str]:
    """
    Read process command line from /proc/<pid>/cmdline.
    """
    try:
        raw = (PROC_PATH / pid / "cmdline").read_bytes()
        return [x.decode(errors="ignore") for x in raw.split(b"\x00") if x]
    except Exception:
        return []


def read_process_comm(pid: str) -> Optional[str]:
    """
    Read process comm from /proc/<pid>/comm.
    """
    try:
        with (PROC_PATH / pid / "comm").open() as f:
            return f.read().strip()
    except Exception:
        return None


def read_process_cwd(pid: str) -> Optional[str]:
    """
    Read process current working directory.
    """
    try:
        return os.readlink(PROC_PATH / pid / "cwd")
    except Exception:
        return None
