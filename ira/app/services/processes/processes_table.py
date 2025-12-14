"""Composite service that builds a full processes table."""

from app.common.TIME_TYPES import TimeType
from app.core.logger import get_logger

from app.shared.pids import iter_pids

from .processes import get_process_cpu_time
from .processes import (
    get_process_memory_percent,
    get_process_memory_res,
    get_process_memory_shared,
    get_process_memory_virt,
)
from .processes import (
    get_process_nice_info,
    get_process_ppid_info,
    get_process_priority_info,
    get_process_state_label,
    get_process_stat_extended,
    get_process_stat_field,
    get_process_user_info,
)

logger = get_logger(__name__)


def get_processes_table(limit: int | None = None) -> list[dict]:
    """
    Return the full processes table with CPU, memory and state information.

    :param limit: Optional maximum number of processes to include.
    :return: List of dictionaries, one per process, with a rich set of
        fields suitable for UI or API consumption.
    """
    processes = []

    for pid in iter_pids():
        try:
            process_info = {
                "pid": int(pid),
                "ppid": get_process_ppid_info(pid),
                "user": get_process_user_info(pid),
                "stat": get_process_stat_field(pid),
                "stat_extended": get_process_stat_extended(pid),
                "time_plus": get_process_cpu_time(pid, TimeType.FORMATTED),
                "nice": get_process_nice_info(pid),
                "priority": get_process_priority_info(pid),
                "virt_kb": get_process_memory_virt(pid),
                "res_kb": get_process_memory_res(pid),
                "shr_kb": get_process_memory_shared(pid),
                "mem_percent": get_process_memory_percent(pid),
            }

            processes.append(process_info)

        except Exception as exc:
            logger.debug("Skipping pid %s: %s", pid, exc)
            continue

    if limit is not None:
        processes = processes[:limit]

    return processes


