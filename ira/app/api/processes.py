from fastapi import APIRouter, Query
from app.services.processes import (
    get_process_state_info,
    list_top_cpu_processes,
    get_processes_overview,
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


@router.get("/process/{pid}/state")
def process_state(pid: int):
    return get_process_state_info(str(pid))
