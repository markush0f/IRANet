import os
import psutil
from typing import List

from app.modules.system.types import (
    DiskPartition,
    DiskProcessUsage,
)


IGNORED_FS_TYPES = {
    "tmpfs",
    "devtmpfs",
    "overlay",
    "squashfs",
    "proc",
    "sysfs",
    "cgroup",
    "cgroup2",
}


def _is_path_in_mount(path: str, mountpoint: str) -> bool:
    try:
        return os.path.commonpath([path, mountpoint]) == mountpoint
    except ValueError:
        return False


def get_disk_partitions() -> List[DiskPartition]:
    partitions = psutil.disk_partitions(all=False)
    result: List[DiskPartition] = []

    for partition in partitions:
        if partition.fstype in IGNORED_FS_TYPES:
            continue

        try:
            usage = psutil.disk_usage(partition.mountpoint)
        except PermissionError:
            continue

        result.append(
            {
                "device": partition.device,
                "mountpoint": partition.mountpoint,
                "filesystem": partition.fstype,
                "total_bytes": usage.total,
                "used_bytes": usage.used,
                "free_bytes": usage.free,
                "used_percent": usage.percent,
            }
        )

    return result


def get_processes_using_mountpoint(
    *,
    mountpoint: str,
    limit: int = 10,
) -> List[DiskProcessUsage]:
    processes: List[DiskProcessUsage] = []

    for proc in psutil.process_iter(
        ["pid", "name", "username", "io_counters", "open_files"]
    ):
        try:
            io = proc.info["io_counters"]
            open_files = proc.info["open_files"] or []

            related_paths = [
                f.path for f in open_files if _is_path_in_mount(f.path, mountpoint)
            ]

            if not related_paths:
                continue

            processes.append(
                {
                    "pid": proc.info["pid"],
                    "name": proc.info["name"],
                    "user": proc.info["username"],
                    "read_bytes": io.read_bytes if io else 0,
                    "write_bytes": io.write_bytes if io else 0,
                    "paths": related_paths[:3],
                }
            )

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    processes.sort(
        key=lambda p: p["write_bytes"] + p["read_bytes"],
        reverse=True,
    )

    return processes[:limit]
