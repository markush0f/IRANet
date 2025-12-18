from typing import Dict
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query

from app.infrastructure.applications.queries import query_application_by_identifier
from app.infrastructure.applications.storage import insert_application
from app.models.requests.create_application_request import CreateApplicationRequest
from app.services.applications.scanner import (
    build_application_identifier,
    create_application,
    discover_application_details,
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


@router.get("/discover/details")
def discover_application_details_endpoint(
    cwd: str = Query(
        description="Project working directory of the discovered application",
    ),
    min_etimes_seconds: int = Query(
        15,
        ge=1,
        description="Minimum uptime in seconds for a process to be considered",
    ),
):
    """
    Return detailed information about a discovered application.

    This endpoint does NOT persist anything.
    It re-runs discovery and builds a frontend-ready object
    for the given project path (cwd).
    """
    details = discover_application_details(
        cwd=cwd,
        min_etimes_seconds=min_etimes_seconds,
    )

    if not details:
        raise HTTPException(
            status_code=404,
            detail="No running application found for the given project path",
        )

    return details


@router.post("")
async def create_application_endpoint(
    payload: CreateApplicationRequest,
):
    application_id = await create_application(payload)

    return {
        "id": str(application_id),
        "status": "created",
    }
