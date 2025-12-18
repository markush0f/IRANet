from typing import List, Dict, Set

from app.modules.scanner.process import scan_processes
from app.modules.scanner.models import ScannedProcess


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


def _group_processes_by_cwd(processes: List[ScannedProcess]) -> Dict[str, Set[str]]:
    grouped: Dict[str, Set[str]] = {}

    for proc in processes:
        if proc.cwd not in grouped:
            grouped[proc.cwd] = set()

        grouped[proc.cwd].add(proc.comm)

    return grouped


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