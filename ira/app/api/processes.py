from fastapi import APIRouter, Query
from app.common.TIME_TYPES import TimeType
from app.modules.processes.top.state import get_process_nice
from app.services.processes import (
    get_process_cpu_time,
    get_process_ppid_info,
    get_process_priority_info,
    get_process_stat_extended,
    list_top_cpu_processes,
    get_processes_overview,
    
)
from app.services.processes_table import get_processes_table

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
    return get_process_nice(str(pid))


@router.get("/table")
def processes_table(limit: int = Query(5, ge=1, le=20)):
    return get_processes_table(limit)