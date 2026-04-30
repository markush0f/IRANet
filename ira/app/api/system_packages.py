from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.logger import get_logger

from app.models.dto.system_packages import SystemPackagesSortBy, SystemPackagesSortDir
from app.modules.system.packages.types import AptAction
from app.services.remote_agent_service import RemoteAgentService
from app.services.system.packages_service import SystemPackagesService


logger = get_logger(__name__)

router = APIRouter(prefix="/system/packages", tags=["system packages"])


@router.get("/")
async def get_packages_paginated(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=250),
    q: Optional[str] = Query(None),
    sort_by: SystemPackagesSortBy = Query("name"),
    sort_dir: SystemPackagesSortDir = Query("asc"),
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    remote = RemoteAgentService(session)
    target_server_id = remote.require_live_server_id(server_id)
    if remote.should_proxy(target_server_id):
        return await remote.get_json(
            server_id=target_server_id,
            path="/system/packages/",
            params={
                "page": page,
                "page_size": page_size,
                "q": q,
                "sort_by": sort_by,
                "sort_dir": sort_dir,
            },
        )
    remote.validate_local_scope(server_id)
    service = SystemPackagesService()
    return service.get_packages_paginated(
        page=page,
        page_size=page_size,
        q=q,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.get("/history")
async def get_packages_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=250),
    action: Optional[AptAction] = Query(None),
    package: Optional[str] = Query(None),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    remote = RemoteAgentService(session)
    target_server_id = remote.require_live_server_id(server_id)
    if remote.should_proxy(target_server_id):
        return await remote.get_json(
            server_id=target_server_id,
            path="/system/packages/history",
            params={
                "page": page,
                "page_size": page_size,
                "action": action,
                "package": package,
                "sort_dir": sort_dir,
                "date_from": date_from,
                "date_to": date_to,
            },
        )
    remote.validate_local_scope(server_id)
    service = SystemPackagesService()
    return service.get_history(
        page=page,
        page_size=page_size,
        action=action,
        package=package,
        sort_dir=sort_dir,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/installed-at/{package}")
async def get_package_installed_at(
    package: str,
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    remote = RemoteAgentService(session)
    target_server_id = remote.require_live_server_id(server_id)
    if remote.should_proxy(target_server_id):
        return await remote.get_json(
            server_id=target_server_id,
            path=f"/system/packages/installed-at/{package}",
        )
    remote.validate_local_scope(server_id)
    service = SystemPackagesService()
    return {
        "package": package,
        "installed_at": service.get_installed_at(package),
    }


@router.get("/active")
async def get_active_packages_history(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    remote = RemoteAgentService(session)
    target_server_id = remote.require_live_server_id(server_id)
    if remote.should_proxy(target_server_id):
        return await remote.get_json(
            server_id=target_server_id,
            path="/system/packages/active",
        )
    remote.validate_local_scope(server_id)
    service = SystemPackagesService()
    return service.get_active_packages_history()
