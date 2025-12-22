from typing import List, TypedDict

from app.modules.system.packages.types import SystemPackage

from typing import Literal

SystemPackagesSortBy = Literal["name", "version", "arch"]
SystemPackagesSortDir = Literal["asc", "desc"]


class SystemPackages(TypedDict):
    page: int
    page_size: int
    total: int
    items: List[SystemPackage]
