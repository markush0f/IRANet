from typing import List


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

            services.append(
                Service(
                    name=name,
                    source="process",
                    status="running",
                    process=" ".join(cmdline) if cmdline else name,
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
                    )
                )

        # Systemd discovery
        for svc in discover_simple_services():
            services.append(
                Service(
                    name=svc.id,
                    source="systemd",
                    status=svc.active_state,
                    process=svc.exec_start,
                )
            )

        return services
