from pathlib import Path
from typing import List, Dict, Set
from uuid import UUID

from app.infrastructure.applications.queries import query_application_by_identifier
from app.infrastructure.applications.storage import insert_application
from app.models.requests.create_application_request import CreateApplicationRequest
from app.modules.scanner.logs import detect_log_paths
from app.modules.scanner.models import ScannedProcess
from app.modules.scanner.ports import scan_listening_ports
from app.modules.scanner.process import scan_processes
from app.services.logs.service import attach_discovered_logs


def discover_applications(min_etimes_seconds: int = 15) -> List[Dict]:
    processes = scan_processes(min_etimes_seconds=min_etimes_seconds)
    return [_build_discovered_application(p) for p in processes]


def discover_applications_grouped(min_etimes_seconds: int = 15) -> List[Dict]:
    """
    Return discovered applications grouped by cwd.

    Each entry represents a candidate application (project),
    not an individual process.
    """
    processes = scan_processes(min_etimes_seconds=min_etimes_seconds)
    grouped = _group_processes_by_cwd(processes)

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
    cwd: str,
    min_etimes_seconds: int = 15,
) -> Dict:
    """
    Build a frontend-ready detailed description of a discovered application.

    This function does NOT persist anything and does NOT assume
    the application is already registered.
    """
    processes: List[ScannedProcess] = scan_processes(
        min_etimes_seconds=min_etimes_seconds
    )

    matched = [p for p in processes if p.cwd == cwd]

    if not matched:
        return {}

    commands = sorted({p.comm for p in matched})
    pids = {p.pid for p in matched}

    # Detect listening ports system-wide
    listening_ports = scan_listening_ports()

    # Match ports belonging to this application
    app_ports = sorted({lp.port for lp in listening_ports if lp.pid in pids})

    # Build access URLs
    access_urls = [f"http://localhost:{port}" for port in app_ports]

    return {
        "project": {
            "cwd": cwd,
            "name_suggestion": _suggest_project_name(cwd),
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


async def create_application(
    data: CreateApplicationRequest,
) -> UUID:
    identifier = build_application_identifier(data.cwd)

    existing = await query_application_by_identifier(identifier=identifier)

    if existing:
        return existing["id"]

    application_id = await insert_application(
        kind="process",
        identifier=identifier,
        name=data.name,
        workdir=data.cwd,
        enabled=True,
    )

    # Initialize log configuration for the application
    await attach_discovered_logs(
        application_id=application_id,
        workdir=data.cwd,
    )

    return application_id


def _build_discovered_application(proc: ScannedProcess) -> Dict:
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


def _build_discovered_application_basic(proc: ScannedProcess) -> Dict:
    return {
        "command": proc.comm,
        "cwd": proc.cwd,
    }


def _suggest_project_name(cwd: str) -> str:
    return Path(cwd).name


def _group_processes_by_cwd(processes: List[ScannedProcess]) -> Dict[str, Set[str]]:
    grouped: Dict[str, Set[str]] = {}

    for proc in processes:
        if proc.cwd not in grouped:
            grouped[proc.cwd] = set()

        grouped[proc.cwd].add(proc.comm)

    return grouped


def build_application_identifier(workdir: str) -> str:
    """
    Build a stable logical identifier for a process-based application.
    """
    return f"process:{workdir}"
