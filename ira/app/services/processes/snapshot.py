from typing import Dict, Any
import time

from typing import Dict, Any
import time

from app.modules.common.base import read_process_name
from app.modules.processes.top.state import (
    get_process_state,
    get_process_state_extended,
    get_process_threads,
    get_process_priority,
    get_process_nice,
    get_process_ppid,
    get_process_user,
)
from app.modules.processes.top.time import (
    get_process_cpu_time_ticks,
    get_process_cpu_time_formatted,
)
from app.modules.processes.top.memory import (
    get_process_memory_res_kb,
    get_process_memory_virt_kb,
    get_process_memory_shared_kb,
)
from app.services.processes.header import build_processes_header
from app.services.processes.table import get_processes_table


def build_processes_snapshot(limit: int = 20) -> Dict[str, Any]:
    """
    Build a full processes snapshot suitable for frontend consumption.

    This snapshot is intended to power top/htop-like views and includes:
    - a system header (uptime, load, cpu, memory, swap)
    - a table of processes ordered by CPU usage
    """
    timestamp = int(time.time())

    header = build_processes_header()
    processes = get_processes_table(limit)

    return {
        "timestamp": timestamp,
        "limit": limit,
        "header": header,
        "processes": processes,
    }


def build_process_snapshot(pid: int) -> Dict[str, Any]:
    """
    Build a full snapshot of a single process.

    This snapshot is intended for detailed process inspection views
    and aggregates CPU, memory, state and scheduling information.
    """
    pid_str = str(pid)
    timestamp = int(time.time())

    state_code = get_process_state(pid_str)

    return {
        "timestamp": timestamp,
        "pid": pid,
        "name": read_process_name(pid_str),
        "user": get_process_user(pid_str),
        "state": {
            "code": state_code,
            "label": get_process_state_extended(state_code),
        },
        "cpu": {
            "time": {
                "ticks": get_process_cpu_time_ticks(pid_str),
                "formatted": get_process_cpu_time_formatted(pid_str),
            },
            # Placeholder for future per-process CPU percent
            "percent": None,
        },
        "memory": {
            "rss_kb": get_process_memory_res_kb(pid_str),
            "virt_kb": get_process_memory_virt_kb(pid_str),
            "shared_kb": get_process_memory_shared_kb(pid_str),
        },
        "threads": get_process_threads(pid_str),
        "priority": get_process_priority(pid_str),
        "nice": get_process_nice(pid_str),
        "parent_pid": get_process_ppid(pid_str),
    }
