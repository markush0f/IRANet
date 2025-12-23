import subprocess
from typing import List, Optional


from app.models.entities.service import Service
from app.modules.scanner.process import scan_processes
from app.modules.services.docker.docker import system_docker_containers
from app.modules.system.proc import (
    list_pids,
    read_process_comm,
    read_process_cmdline,
)

from app.modules.systemd.simple.discovery import discover_simple_services


class ServiceDiscoveryOrchestrator:
    def discover_all(self) -> List[Service]:
        services: List[Service] = []

        # Process-level discovery (/proc)
        for pid in list_pids():
            name = read_process_comm(pid)
            if not name:
                continue

            cmdline = read_process_cmdline(pid)
            pid_int = int(pid)
            port = self._get_listening_port_by_pid(pid_int)

            services.append(
                Service(
                    name=name,
                    source="process",
                    status="running",
                    process=" ".join(cmdline) if cmdline else name,
                    pid=pid_int,
                    port=port,
                )
            )

        # Application-level discovery
        for proc in scan_processes():
            services.append(
                Service(
                    name=proc.comm,
                    source="application",
                    status="running",
                    process=" ".join(proc.cmdline),
                    pid=proc.pid,
                    port=(
                        self._get_listening_port_by_pid(proc.pid) if proc.pid else None
                    ),
                )
            )

        # Docker discovery
        containers = system_docker_containers()
        if isinstance(containers, list):
            for c in containers:
                services.append(
                    Service(
                        name=c["name"],
                        source="docker",
                        status=c["status"],
                        image=",".join(c["image"]) if c.get("image") else None,
                        pid=None,
                        port=None,
                    )
                )

        # Systemd discovery
        for svc in discover_simple_services():
            pid = svc.main_pid if svc.main_pid and svc.main_pid > 0 else None

            services.append(
                Service(
                    name=svc.id,
                    source="systemd",
                    status=svc.active_state,
                    process=svc.exec_start,
                    pid=pid,
                    port=self._get_listening_port_by_pid(pid) if pid else None,
                )
            )

        return services

    def _get_listening_port_by_pid(self, pid: int) -> Optional[int]:
        try:
            output = subprocess.check_output(
                ["ss", "-tulnp"],
                text=True,
            )
        except Exception:
            return None

        pid_token = f"pid={pid},"

        for line in output.splitlines():
            if pid_token not in line:
                continue

            parts = line.split()
            for part in parts:
                if ":" in part:
                    try:
                        return int(part.rsplit(":", 1)[-1])
                    except ValueError:
                        continue

        return None
