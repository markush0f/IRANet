from typing import Optional
from app.models.dto.system_packages import SystemPackages, SystemPackagesSortBy, SystemPackagesSortDir
from app.modules.system.packages.apt_packages import installed_packages


class SystemPackagesService:

    def get_packages_paginated(
        self,
        *,
        page: int,
        page_size: int,
        q: Optional[str] = None,
        sort_by: SystemPackagesSortBy = "name",
        sort_dir: SystemPackagesSortDir = "asc",
    ) -> SystemPackages:
        packages = installed_packages()

        if q:
            needle = q.strip().lower()
            packages = [p for p in packages if needle in p["name"].lower()]

        reverse = sort_dir == "desc"

        if sort_by in {"name", "version", "arch"}:
            packages = sorted(
                packages,
                key=lambda p: p[sort_by],
                reverse=reverse,
            )

        total = len(packages)

        if q:
            return {
                "page": 1,
                "page_size": total,
                "total": total,
                "items": packages,
            }

        start = (page - 1) * page_size
        end = start + page_size

        return {
            "page": page,
            "page_size": page_size,
            "total": total,
            "items": packages[start:end],
        }
