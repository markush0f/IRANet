from typing import Optional
from fastapi import APIRouter, Query
from app.core.logger import get_logger

from app.models.dto.system_packages import SystemPackagesSortBy, SystemPackagesSortDir
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
