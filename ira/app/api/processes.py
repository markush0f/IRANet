from fastapi import APIRouter, Query
from app.common.TIME_TYPES import TimeType

from app.services.processes.processes import get_processes_overview
from app.services.processes.processes_cpu import (
    get_process_cpu_time,
    list_top_cpu_processes,
)
from app.services.processes.processes_state import (
    get_process_ppid_info,
    get_process_priority_info,
    get_process_stat_extended,
    get_process_nice_info,
)
from app.services.processes.processes_table import get_processes_table
from app.services.processes.processes_header import (
    get_system_header,
    get_system_uptime_formatted,
    get_load_average_info,
    get_tasks_summary_named_info,
)

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/top")
def top_processes(limit: int = Query(5, ge=1, le=20)):
    """Get the top CPU-consuming processes."""
    return list_top_cpu_processes(limit)


@router.get("/top/summary")
def top_processes_summary(limit: int = Query(5, ge=1, le=20)):
    """Get aggregated top processes information (CPU and memory)."""
    return get_processes_overview(limit)


@router.get("/process/{pid}/stat")
def build_process_stat(pid: int):
    return get_process_stat_extended(str(pid))


@router.get("/process/cpu/time/{pid}")
def process_cpu_time(pid: int, time_type: TimeType = TimeType.TICKS):
    return get_process_cpu_time(str(pid), time_type)


@router.get("/process/{pid}/ppid")
def process_ppid(pid: int):
    return get_process_ppid_info(str(pid))


@router.get("/process/{pid}/priority")
def process_priority(pid: int):
    return get_process_priority_info(str(pid))


@router.get("/process/{pid}/nice")
def process_nice(pid: int):
    return get_process_nice_info(str(pid))


@router.get("/table")
def processes_table(limit: int = Query(5, ge=1, le=20)):
    return get_processes_table(limit)


@router.get("/header/uptime")
def header_uptime():
    """Return the formatted system uptime."""
    return {"uptime": get_system_uptime_formatted()}


@router.get("/header/load")
def header_load():
    """Return the system load averages (1, 5, 15 minutes)."""
    return get_load_average_info()


@router.get("/header/tasks")
def header_tasks():
    """Return a summary of tasks grouped by named states."""
    return get_tasks_summary_named_info()


@router.get("/header/full")
def header_full():
    return get_system_header()