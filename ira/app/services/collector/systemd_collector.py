import subprocess
from datetime import datetime, timezone
from typing import Optional

from app.models.dto.application_collected_metrics import ApplicationCollectedMetricsDTO
from app.models.entities.application import Application
from app.modules.scanner.ports import scan_listening_ports



def _parse_timestamp(value: str) -> Optional[int]:
    if not value or value == "n/a":
        return None

    try:
        dt = datetime.strptime(value, "%a %Y-%m-%d %H:%M:%S %Z")
        dt = dt.replace(tzinfo=timezone.utc)
        return int((datetime.now(timezone.utc) - dt).total_seconds())
    except Exception:
        return None


def _find_primary_port_for_pid(pid: int) -> Optional[int]:
    ports = sorted({lp.port for lp in scan_listening_ports() if lp.pid == pid})
    return ports[0] if ports else None


async def collect_systemd_metrics(
    application: Application,
) -> Optional[ApplicationCollectedMetricsDTO]:
    if not application.identifier:
        return None

    try:
        result = subprocess.run(
            [
                "systemctl",
                "show",
                application.identifier,
                "--property=ActiveState",
                "--property=SubState",
                "--property=MainPID",
                "--property=MemoryCurrent",
                "--property=CPUUsageNSec",
                "--property=NRestarts",
                "--property=ActiveEnterTimestamp",
            ],
            capture_output=True,
            text=True,
            check=True,
        )

        data: dict[str, str] = {}

        for line in result.stdout.splitlines():
            if "=" in line:
                key, value = line.split("=", 1)
                data[key] = value

        status = (
            "running"
            if data.get("ActiveState") == "active"
            else "stopped"
        )

        pid: Optional[int] = None
        if data.get("MainPID") and data["MainPID"].isdigit():
            parsed_pid = int(data["MainPID"])
            pid = parsed_pid if parsed_pid > 0 else None

        port = _find_primary_port_for_pid(pid) if pid else None

        memory_mb = None
        if data.get("MemoryCurrent") and data["MemoryCurrent"].isdigit():
            memory_mb = int(data["MemoryCurrent"]) / 1024 / 1024

        uptime_seconds = _parse_timestamp(
            data.get("ActiveEnterTimestamp", "")
        )

        restart_count = None
        if data.get("NRestarts") and data["NRestarts"].isdigit():
            restart_count = int(data["NRestarts"])

        return ApplicationCollectedMetricsDTO(
            cpu_percent=None,
            memory_mb=memory_mb,
            memory_percent=None,
            pid=pid,
            port=port,
            uptime_seconds=uptime_seconds,
            threads=None,
            restart_count=restart_count,
            status=status,
        )

    except subprocess.CalledProcessError:
        return ApplicationCollectedMetricsDTO(
            status="stopped",
        )
