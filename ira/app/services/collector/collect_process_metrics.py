from datetime import datetime
from typing import Optional

import os
import psutil

from app.models.dto.application_collected_metrics import (
    ApplicationCollectedMetricsDTO,
)
from app.models.entities.application import Application
from app.modules.scanner.ports import scan_listening_ports


def _find_process_by_path(path: str) -> Optional[psutil.Process]:
    target = os.path.realpath(path)
    for proc in psutil.process_iter(
        attrs=["pid", "exe", "cmdline", "create_time"]
    ):
        try:
            exe = proc.info.get("exe") or ""
            cmdline = " ".join(proc.info.get("cmdline") or [])

            cwd = ""
            try:
                cwd = proc.cwd() or ""
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                cwd = ""

            exe_real = os.path.realpath(exe) if exe else ""
            cwd_real = os.path.realpath(cwd) if cwd else ""

            if (
                target
                and (
                    target in exe_real
                    or target in cmdline
                    or cwd_real == target
                    or (cwd_real.startswith(target + os.sep))
                )
            ):
                return proc

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return None


def _find_primary_port_for_pid(pid: int) -> Optional[int]:
    ports = sorted({lp.port for lp in scan_listening_ports() if lp.pid == pid})
    return ports[0] if ports else None


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
        pid = proc.pid
        port = _find_primary_port_for_pid(pid)

        uptime_seconds = int(
            datetime.utcnow().timestamp() - proc.create_time()
        )

        return ApplicationCollectedMetricsDTO(
            pid=pid,
            port=port,
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
