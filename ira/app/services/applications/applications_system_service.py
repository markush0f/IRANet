from pathlib import Path
from typing import List, Dict, Set
from uuid import UUID

from app.models.requests.create_application_request import CreateApplicationRequest
from app.modules.scanner.logs import detect_log_paths
from app.modules.scanner.models import ScannedProcess
from app.modules.scanner.ports import scan_listening_ports
from app.modules.scanner.process import scan_processes

from app.repositories.applications import ApplicationRepository
from app.services.logs_service import ApplicationLogsService


class ApplicationsSystemService:
    def __init__(self, session) -> None:
        self._applications_repo = ApplicationRepository(session)
        self._logs_service = ApplicationLogsService(session)

    def discover_applications(
        self,
        min_etimes_seconds: int = 15,
    ) -> List[Dict]:
        processes = scan_processes(min_etimes_seconds=min_etimes_seconds)
        return [self._build_discovered_application(p) for p in processes]

    def discover_applications_grouped(
        self,
        min_etimes_seconds: int = 15,
    ) -> List[Dict]:
        processes = scan_processes(min_etimes_seconds=min_etimes_seconds)
        grouped = self._group_processes_by_cwd(processes)

        result: List[Dict] = []

        for cwd, commands in grouped.items():
            result.append(
                {
                    "cwd": cwd,
                    "commands": sorted(commands),
                }
            )

        return result

    def discover_application_details(
        self,
        *,
        cwd: str,
        min_etimes_seconds: int = 15,
    ) -> Dict:
        processes: List[ScannedProcess] = scan_processes(
            min_etimes_seconds=min_etimes_seconds
        )

        matched = [p for p in processes if p.cwd == cwd]

        if not matched:
            return {}

        commands = sorted({p.comm for p in matched})
        pids = {p.pid for p in matched}

        listening_ports = scan_listening_ports()
        app_ports = sorted({lp.port for lp in listening_ports if lp.pid in pids})
        access_urls = [f"http://localhost:{port}" for port in app_ports]

        return {
            "project": {
                "cwd": cwd,
                "name_suggestion": self._suggest_project_name(cwd),
                "exists": Path(cwd).exists(),
            },
            "runtime": {
                "commands": commands,
                "process_count": len(matched),
            },
            "processes": [
                {
                    "command": p.comm,
                    "cmdline": p.cmdline,
                    "uptime_seconds": p.etimes,
                }
                for p in matched
            ],
            "paths": {
                "log_paths": detect_log_paths(cwd),
            },
            "access": {
                "ports": app_ports,
                "urls": access_urls,
                "available": bool(access_urls),
            },
            "meta": {
                "discovered": True,
                "persisted": False,
            },
        }

    def _build_discovered_application(
        self,
        proc: ScannedProcess,
    ) -> Dict:
        return {
            "pid": proc.pid,
            "command": proc.comm,
            "cmdline": proc.cmdline,
            "cwd": proc.cwd,
            "uptime_seconds": proc.etimes,
            "file_path": proc.file_path,
            "port": proc.port,
            "npm_mode": proc.npm_mode,
            "status": "discovered",
        }

    def _build_discovered_application_basic(
        self,
        proc: ScannedProcess,
    ) -> Dict:
        return {
            "command": proc.comm,
            "cwd": proc.cwd,
        }

    def _suggest_project_name(
        self,
        cwd: str,
    ) -> str:
        return Path(cwd).name

    def _group_processes_by_cwd(
        self,
        processes: List[ScannedProcess],
    ) -> Dict[str, Set[str]]:
        grouped: Dict[str, Set[str]] = {}

        for proc in processes:
            if proc.cwd not in grouped:
                grouped[proc.cwd] = set()

            grouped[proc.cwd].add(proc.comm)

        return grouped
