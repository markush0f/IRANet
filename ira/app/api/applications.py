from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.models.requests.create_application_request import CreateApplicationRequest
from app.services.applications.applications import ApplicationsService
from app.services.applications.applications_system_service import (
    ApplicationsSystemService,
)


router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/discover")
def discover(
    session: AsyncSession = Depends(get_session),
    min_etimes_seconds: int = Query(
        15,
        ge=1,
        description="Minimum uptime in seconds for a process to be considered an application",
    ),
):
    """
    Discover running applications on the host system.

    This endpoint scans currently running processes and returns
    candidates that could represent user applications based on
    their execution time.

    Characteristics:
    - No data is persisted
    - Results are ephemeral
    - All returned items have status = 'discovered'

    Parameters:
    - min_etimes_seconds: Minimum process uptime in seconds

    Returns:
    - A list of discovered application candidates
    """
    service = ApplicationsSystemService(session)
    return service.discover_applications(min_etimes_seconds=min_etimes_seconds)


@router.get("/discover/basic/grouped")
def discover_basic_grouped(
    session: AsyncSession = Depends(get_session),
    min_etimes_seconds: int = Query(
        15,
        ge=1,
        description="Minimum uptime in seconds for a process to be considered an application",
    ),
):
    """
    Discover running applications with minimal grouped information.

    This endpoint returns a simplified view of discovered applications,
    grouped by project working directory (cwd).

    Only the minimum identifying fields are included:
    - command
    - cwd

    Characteristics:
    - No data is persisted
    - Lightweight response for fast UI rendering
    - Intended for application selection flows

    Parameters:
    - min_etimes_seconds: Minimum process uptime in seconds

    Returns:
    - A grouped list of discovered application candidates
    """
    service = ApplicationsSystemService(session)
    return service.discover_applications_grouped(min_etimes_seconds=min_etimes_seconds)


@router.get("/discover/details")
def discover_application_details_endpoint(
    session: AsyncSession = Depends(get_session),
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
    Retrieve detailed information about a discovered application.

    This endpoint re-runs the discovery process and returns
    a detailed, frontend-ready object for a specific project
    directory (cwd).

    Characteristics:
    - No data is persisted
    - Used to enrich discovered applications with extra details
    - Safe to call repeatedly

    Parameters:
    - cwd: Project working directory
    - min_etimes_seconds: Minimum process uptime in seconds

    Returns:
    - A detailed representation of the discovered application

    Raises:
    - 404 if no running application is found for the given cwd
    """
    service = ApplicationsSystemService(session)
    details = service.discover_application_details(
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
async def create_application(
    data: CreateApplicationRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Create and persist a new application.

    This endpoint registers a user application in the system,
    persists it in the database, and attaches any discovered
    log paths to it.

    Characteristics:
    - Idempotent by application identifier
    - If the application already exists, its ID is returned
    - Log paths are automatically associated

    Parameters:
    - data: Application creation payload

    Returns:
    - The application ID
    - Creation status
    """
    service = ApplicationsService(session)
    application_id = await service.create_application(data=data)

    return {
        "id": str(application_id),
        "status": "created",
    }


@router.get("/all/list/")
async def applications_list(
    session: AsyncSession = Depends(get_session),
):
    """
    List all registered applications.

    This endpoint returns every application persisted in the system,
    regardless of whether it has associated logs.

    Characteristics:
    - Includes disabled applications
    - Intended for administrative or overview dashboards

    Returns:
    - A list of all applications
    """
    service = ApplicationsService(session)
    return await service.applications_lists()


@router.get("/list/logs")
async def applications_list_with_path_logs(
    session: AsyncSession = Depends(get_session),
):
    """
    List applications that have associated log paths.

    This endpoint returns only applications that have
    at least one log path registered.

    Each application is returned with:
    - Basic application metadata
    - A list of associated log paths

    Characteristics:
    - Filters out applications without logs
    - Frontend-ready response format

    Returns:
    - A list of applications with their log paths
    """
    service = ApplicationsService(session)
    return await service.applications_list_with_path_logs()
