from datetime import datetime
from typing import Optional

import psutil

from app.models.dto.application_collected_metrics import (
    ApplicationCollectedMetricsDTO,
)
from app.models.entities.application import Application


def _find_process_by_path(path: str) -> Optional[psutil.Process]:
    for proc in psutil.process_iter(
        attrs=["pid", "exe", "cmdline", "create_time"]
    ):
        try:
            exe = proc.info.get("exe") or ""
            cmdline = " ".join(proc.info.get("cmdline") or [])

            if path in exe or path in cmdline:
                return proc

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return None


async def collect_process_metrics(
    application: Application,
) -> ApplicationCollectedMetricsDTO:
    identifier = application.identifier or ""

    if not identifier.startswith("process:"):
        return ApplicationCollectedMetricsDTO(status="unknown")

    process_path = identifier.removeprefix("process:").strip()

    proc = _find_process_by_path(process_path)

    if not proc:
        return ApplicationCollectedMetricsDTO(status="stopped")

    try:
        cpu_percent = proc.cpu_percent(interval=None)
        mem_info = proc.memory_info()

        uptime_seconds = int(
            datetime.utcnow().timestamp() - proc.create_time()
        )

        return ApplicationCollectedMetricsDTO(
            cpu_percent=cpu_percent,
            memory_mb=mem_info.rss / 1024 / 1024,
            memory_percent=proc.memory_percent(),
            uptime_seconds=uptime_seconds,
            threads=proc.num_threads(),
            restart_count=None,
            status="running",
        )

    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return ApplicationCollectedMetricsDTO(status="stopped")
