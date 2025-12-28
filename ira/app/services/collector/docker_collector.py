import json
import subprocess
from datetime import datetime, timezone
from typing import Optional

from app.models.dto.application_collected_metrics import ApplicationCollectedMetricsDTO
from app.models.entities.application import Application



def _parse_mem_to_mb(value: str) -> Optional[float]:
    try:
        number, unit = value.strip().split()
        number = float(number)

        if unit.lower().startswith("kb"):
            return number / 1024
        if unit.lower().startswith("mb"):
            return number
        if unit.lower().startswith("gb"):
            return number * 1024

    except Exception:
        return None

    return None


async def collect_docker_metrics(
    application: Application,
) -> Optional[ApplicationCollectedMetricsDTO]:
    if not application.identifier:
        return None

    try:
        stats = subprocess.run(
            [
                "docker",
                "stats",
                application.identifier,
                "--no-stream",
                "--format",
                "{{ json . }}",
            ],
            capture_output=True,
            text=True,
            check=True,
        )

        data = json.loads(stats.stdout.strip())

        cpu_percent = None
        if data.get("CPUPerc"):
            cpu_percent = float(data["CPUPerc"].replace("%", ""))

        memory_mb = None
        memory_percent = None

        if data.get("MemUsage") and data.get("MemPerc"):
            used, _ = data["MemUsage"].split("/")
            memory_mb = _parse_mem_to_mb(used.strip())
            memory_percent = float(data["MemPerc"].replace("%", ""))

        uptime_seconds = None
        try:
            inspect = subprocess.run(
                [
                    "docker",
                    "inspect",
                    "-f",
                    "{{ .State.StartedAt }}",
                    application.identifier,
                ],
                capture_output=True,
                text=True,
                check=True,
            )

            started_at = inspect.stdout.strip()
            started_dt = datetime.fromisoformat(
                started_at.replace("Z", "+00:00")
            )
            uptime_seconds = int(
                (datetime.now(timezone.utc) - started_dt).total_seconds()
            )
        except Exception:
            pass

        return ApplicationCollectedMetricsDTO(
            cpu_percent=cpu_percent,
            memory_mb=memory_mb,
            memory_percent=memory_percent,
            uptime_seconds=uptime_seconds,
            threads=None,
            restart_count=None,
            status="running",
        )

    except subprocess.CalledProcessError:
        return ApplicationCollectedMetricsDTO(
            status="stopped",
        )
