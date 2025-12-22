from typing import List, Optional
from app.models.dto.system_packages import (
    SystemPackages,
    SystemPackagesSortBy,
    SystemPackagesSortDir,
)
from app.models.dto.system_packages_history import SystemPackageHistoryEntry
from app.modules.system.packages.apt_history import read_apt_history
from app.modules.system.packages.apt_packages import installed_packages
from app.modules.system.packages.types import AptAction, AptHistoryEntry


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

    @staticmethod
    def get_history(
        *,
        page: int,
        page_size: int,
        action: Optional[AptAction] = None,
        package: Optional[str] = None,
        sort_dir: str = "desc",
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> dict:
        entries: List[AptHistoryEntry] = read_apt_history(limit=2000)

        if action:
            entries = [e for e in entries if e["action"] == action]

        if package:
            needle = package.lower()
            entries = [
                e for e in entries if any(needle in p.lower() for p in e["packages"])
            ]

        if date_from:
            entries = [e for e in entries if e["date"] >= date_from]

        if date_to:
            entries = [e for e in entries if e["date"] <= date_to]

        entries = sorted(
            entries,
            key=lambda e: e["date"],
            reverse=(sort_dir == "desc"),
        )

        total = len(entries)
        start = (page - 1) * page_size
        end = start + page_size

        items: List[SystemPackageHistoryEntry] = [
            {
                "date": e["date"],
                "action": e["action"],
                "packages": e["packages"],
                "command": e["command"],
            }
            for e in entries[start:end]
        ]

        return {
            "page": page,
            "page_size": page_size,
            "total": total,
            "items": items,
        }

    @staticmethod
    def get_installed_at(package: str) -> Optional[str]:
        entries = read_apt_history(limit=5000)

        for entry in reversed(entries):
            if package in entry["packages"] and entry["action"] == "install":
                return entry["date"]

        return None

    @staticmethod
    def get_active_packages_history() -> List[SystemPackageHistoryEntry]:
        installed = {p["name"] for p in installed_packages()}
        entries = read_apt_history(limit=5000)

        active = [e for e in entries if any(p in installed for p in e["packages"])]

        return [
            {
                "date": e["date"],
                "action": e["action"],
                "packages": e["packages"],
                "command": e["command"],
            }
            for e in active
        ]
