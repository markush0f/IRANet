from pathlib import Path
from typing import List, Dict, Set

from app.modules.scanner.logs import detect_log_paths
from app.modules.scanner.models import ScannedProcess
from app.modules.scanner.process import scan_processes


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
        "meta": {
            "discovered": True,
            "persisted": False,
        },
    }


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
