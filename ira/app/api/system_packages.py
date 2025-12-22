from typing import Optional
from fastapi import APIRouter, Query
from app.core.logger import get_logger

from app.models.dto.system_packages import SystemPackagesSortBy, SystemPackagesSortDir
from app.modules.system.packages.types import AptAction
from app.services.system_packages.packages_service import SystemPackagesService


logger = get_logger(__name__)

router = APIRouter(prefix="/system/packages", tags=["system packages"])


@router.get("/")
def get_packages_paginated(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=250),
    q: Optional[str] = Query(None),
    sort_by: SystemPackagesSortBy = Query("name"),
    sort_dir: SystemPackagesSortDir = Query("asc"),
):
    service = SystemPackagesService()
    return service.get_packages_paginated(
        page=page,
        page_size=page_size,
        q=q,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.get("/history")
def get_packages_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=250),
    action: Optional[AptAction] = Query(None),
    package: Optional[str] = Query(None),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
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
def get_package_installed_at(package: str):
    service = SystemPackagesService()
    return {
        "package": package,
        "installed_at": service.get_installed_at(package),
    }


@router.get("/active")
def get_active_packages_history():
    service = SystemPackagesService()
    return service.get_active_packages_history()
