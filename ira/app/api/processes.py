from fastapi import APIRouter, Query

from app.services.processes_service import ProcessesService




router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/snapshot")
def processes_snapshot(limit: int = Query(20, ge=1, le=100)):
    """
    Return a full processes snapshot.

    Includes:
    - system header (top-like)
    - processes table
    """
    service = ProcessesService()
    return service.build_processes_snapshot(limit)


@router.get("/{pid}")
def process_snapshot(pid: int):
    """
    Return a full snapshot of a single process.
    """
    service = ProcessesService()
    return service.build_process_snapshot(pid)
