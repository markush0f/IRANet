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

        uptime_seconds: Optional[int] = None
        pid: Optional[int] = None
        port: Optional[int] = None

        try:
            inspect = subprocess.run(
                ["docker", "inspect", application.identifier],
                capture_output=True,
                text=True,
                check=True,
            )
            inspect_data = json.loads(inspect.stdout.strip())
            container = inspect_data[0] if inspect_data else {}

            started_at = container.get("State", {}).get("StartedAt")
            if isinstance(started_at, str) and started_at:
                started_dt = datetime.fromisoformat(
                    started_at.replace("Z", "+00:00")
                )
                uptime_seconds = int(
                    (datetime.now(timezone.utc) - started_dt).total_seconds()
                )

            parsed_pid = container.get("State", {}).get("Pid")
            if isinstance(parsed_pid, int) and parsed_pid > 0:
                pid = parsed_pid

            ports = container.get("NetworkSettings", {}).get("Ports") or {}
            if isinstance(ports, dict):
                host_ports: list[int] = []
                for _container_port, bindings in ports.items():
                    if not bindings:
                        continue
                    if isinstance(bindings, list):
                        for binding in bindings:
                            host_port = binding.get("HostPort") if isinstance(binding, dict) else None
                            if isinstance(host_port, str) and host_port.isdigit():
                                host_ports.append(int(host_port))
                host_ports.sort()
                port = host_ports[0] if host_ports else None
        except Exception:
            pass

        return ApplicationCollectedMetricsDTO(
            cpu_percent=cpu_percent,
            memory_mb=memory_mb,
            memory_percent=memory_percent,
            pid=pid,
            port=port,
            uptime_seconds=uptime_seconds,
            threads=None,
            restart_count=None,
            status="running",
        )

    except subprocess.CalledProcessError:
        return ApplicationCollectedMetricsDTO(
            status="stopped",
        )
