from fastapi import APIRouter, Query
from app.modules.processes.top import get_top_processes

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/top")
def top_processes(limit: int = Query(5, ge=1, le=20)):
    return get_top_processes(limit)
