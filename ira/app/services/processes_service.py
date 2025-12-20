from time import time
from typing import Any, Dict
from app.core.logger import get_logger
from app.modules.common.base import read_process_name
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
    get_process_threads,
    get_process_user,
    read_tasks_summary_named,
)
from app.modules.processes.top.system import load_average
from app.modules.processes.top.time import (
    get_process_cpu_time_formatted,
    get_process_cpu_time_ticks,
)
from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import read_memory_and_swap_status
from app.modules.system.proc import read_uptime_seconds
from app.shared.pids import iter_pids

logger = get_logger(__name__)


class ProcessesService:

    def _format_uptime(self, seconds: int) -> str:
        """
        Format system uptime like top (DD days, HH:MM).
        """
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60

        if days > 0:
            return f"{days} days, {hours:02d}:{minutes:02d}"
        return f"{hours:02d}:{minutes:02d}"

    def build_processes_header(self) -> Dict[str, Any]:
        """
        Build a top-like header to be used together with process tables.
        """
        uptime_seconds = int(read_uptime_seconds())
        memory_status = read_memory_and_swap_status()

        return {
            "uptime": self._format_uptime(uptime_seconds),
            "load_average": load_average(),
            "tasks": read_tasks_summary_named(),
            "cpu": get_cpu_global_top_percent(),
            "memory": memory_status["memory"],
            "swap": memory_status["swap"],
        }

    def build_processes_snapshot(self, limit: int = 20) -> Dict[str, Any]:
        """
        Build a full processes snapshot suitable for frontend consumption.

        This snapshot is intended to power top/htop-like views and includes:
        - a system header (uptime, load, cpu, memory, swap)
        - a table of processes ordered by CPU usage
        """
        timestamp = int(time.time())

        header = self.build_processes_header()
        processes = self.get_processes_table(limit)

        return {
            "timestamp": timestamp,
            "limit": limit,
            "header": header,
            "processes": processes,
        }

    def build_process_snapshot(self, pid: int) -> Dict[str, Any]:
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

    def get_processes_table(self, limit: int | None = None) -> list[dict]:
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
