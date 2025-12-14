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
from app.services.processes.processes_header import build_processes_header

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/top")
def top_processes(limit: int = Query(5, ge=1, le=20)):
    """Return the top CPU-consuming processes."""
    return list_top_cpu_processes(limit)


@router.get("/top/summary")
def top_processes_summary(limit: int = Query(5, ge=1, le=20)):
    """Return aggregated CPU and memory information for top processes."""
    return get_processes_overview(limit)


@router.get("/process/{pid}/stat")
def process_stat(pid: int):
    """Return extended process state information."""
    return get_process_stat_extended(str(pid))


@router.get("/process/cpu/time/{pid}")
def process_cpu_time(pid: int, time_type: TimeType = TimeType.TICKS):
    """Return CPU time consumed by a process in the requested unit."""
    return get_process_cpu_time(str(pid), time_type)


@router.get("/process/{pid}/ppid")
def process_ppid(pid: int):
    """Return the parent process ID (PPID)."""
    return get_process_ppid_info(str(pid))


@router.get("/process/{pid}/priority")
def process_priority(pid: int):
    """Return the scheduling priority (PRI)."""
    return get_process_priority_info(str(pid))


@router.get("/process/{pid}/nice")
def process_nice(pid: int):
    """Return the nice value (NI) of the process."""
    return get_process_nice_info(str(pid))


@router.get("/table")
def processes_table(limit: int = Query(5, ge=1, le=20)):
    """Return a table-like list of processes."""
    return get_processes_table(limit)


@router.get("/header")
def processes_header():
    """
    Return the full top-like system header for process views.
    """
    return build_processes_header()
