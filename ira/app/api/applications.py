from fastapi import APIRouter, Query

from app.services.applications.scanner import (
    discover_applications,
    discover_applications_grouped,
)


router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/discover")
def discover(
    min_etimes_seconds: int = Query(
        15,
        ge=1,
        description="Minimum uptime in seconds for a process to be considered an application",
    )
):
    """
    Discover running applications.

    This endpoint returns processes detected by the system scanner
    that could represent user applications.

    No data is persisted. All results are returned with status='discovered'.
    """
    return discover_applications(min_etimes_seconds=min_etimes_seconds)


@router.get("/discover/basic/grouped")
def discover_basic_grouped(
    min_etimes_seconds: int = Query(
        15,
        ge=1,
        description="Minimum uptime in seconds for a process to be considered an application",
    )
):
    """
    Discover running applications with minimal information.

    This endpoint returns processes detected by the system scanner
    that could represent user applications.

    Only includes the fields required to identify an application:
    - command
    - cwd

    No data is persisted. All results are returned with status='discovered'.
    """
    return discover_applications_grouped(min_etimes_seconds=min_etimes_seconds)
