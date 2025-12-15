from fastapi import APIRouter, Query

from app.services.processes.processes_snapshot import build_processes_snapshot
from app.services.processes.process_snapshot import build_process_snapshot

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/snapshot")
def processes_snapshot(limit: int = Query(20, ge=1, le=100)):
    """
    Return a full processes snapshot.

    Includes:
    - system header (top-like)
    - processes table
    """
    return build_processes_snapshot(limit)


@router.get("/{pid}")
def process_snapshot(pid: int):
    """
    Return a full snapshot of a single process.
    """
    return build_process_snapshot(pid)
