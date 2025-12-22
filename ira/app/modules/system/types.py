from typing import TypedDict, List


class DiskPartition(TypedDict):
    device: str
    mountpoint: str
    filesystem: str
    total_bytes: int
    used_bytes: int
    free_bytes: int
    used_percent: float


class DiskProcessUsage(TypedDict):
    pid: int
    name: str
    user: str | None
    read_bytes: int
    write_bytes: int
    paths: List[str]
