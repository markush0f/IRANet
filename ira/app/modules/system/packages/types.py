from typing import List, Literal, Optional, TypedDict

SortBy = Literal["name", "version", "arch"]
SortDir = Literal["asc", "desc"]


class SystemPackage(TypedDict):
    name: str
    version: str
    arch: str
    origin: Literal["apt"]


class PackagesQuery(TypedDict, total=False):
    q: Optional[str]
    sort_by: SortBy
    sort_dir: SortDir
    page: int
    page_size: int


class PaginatedSystemPackages(TypedDict):
    page: int
    page_size: int
    total: int
    items: List[SystemPackage]
