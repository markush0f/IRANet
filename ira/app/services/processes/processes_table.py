"""Composite service that builds a full processes table."""

from app.core.logger import get_logger
from app.shared.pids import iter_pids

from app.modules.processes.top.time import get_process_cpu_time_formatted
from app.modules.processes.top.memory import (
    get_process_memory_res_kb,
    get_process_memory_shared_kb,
    get_process_memory_virt_kb,
)
from app.modules.processes.top.state import (
    get_process_nice,
    get_process_ppid,
    get_process_priority,
    get_process_state,
    get_process_state_extended,
    get_process_user,
)
from app.modules.common.base import read_process_name

logger = get_logger(__name__)


def get_processes_table(limit: int | None = None) -> list[dict]:
    """
    Return a table-like list of processes with CPU, memory and state info.

    This function is intended to power top/htop-like tables in the frontend.
    It performs no aggregation beyond per-process data collection.

    :param limit: Optional maximum number of processes to include.
    :return: List of process dictionaries.
    """
    processes: list[dict] = []

    for pid in iter_pids():
        if limit is not None and len(processes) >= limit:
            break

        try:
            pid_str = pid
            pid_int = int(pid)
            state_code = get_process_state(pid_str)

            processes.append(
                {
                    "pid": pid_int,
                    "ppid": get_process_ppid(pid_str),
                    "name": read_process_name(pid_str),
                    "user": get_process_user(pid_str),
                    "state": {
                        "code": state_code,
                        "label": get_process_state_extended(state_code),
                    },
                    "cpu": {
                        "time_formatted": get_process_cpu_time_formatted(pid_str),
                    },
                    "memory": {
                        "virt_kb": get_process_memory_virt_kb(pid_str),
                        "res_kb": get_process_memory_res_kb(pid_str),
                        "shared_kb": get_process_memory_shared_kb(pid_str),
                    },
                    "priority": get_process_priority(pid_str),
                    "nice": get_process_nice(pid_str),
                }
            )

        except Exception as exc:
            logger.debug("Skipping pid %s: %s", pid, exc)

    return processes
