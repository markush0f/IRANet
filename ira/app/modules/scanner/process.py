import os
from pathlib import Path
from typing import List, Optional

from app.modules.system.proc import (
    list_pids,
    read_process_cmdline,
    read_process_comm,
    read_process_cwd,
    read_process_stat,
    read_uptime_seconds,
)

from .models import ScannedProcess


ALLOWED_COMMANDS = {
    "uvicorn",
    "node",
    "npm",
    "python",
    "python3",
}

EXCLUDED_CWD_FRAGMENTS = {
    ".vscode-server",
    "/extensions/",
    "/node_modules/typescript",
    "/usr/share/",
    "/snap/",
}


def _read_etimes_seconds(pid: str, uptime_seconds: float) -> Optional[int]:
    stat = read_process_stat(pid)
    if not stat:
        return None

    rparen = stat.rfind(")")
    if rparen == -1:
        return None

    after = stat[rparen + 2 :].split()

    try:
        starttime_ticks = int(after[19])
    except (IndexError, ValueError):
        return None

    hz = os.sysconf(os.sysconf_names["SC_CLK_TCK"])
    start_seconds = starttime_ticks / hz
    return int(max(uptime_seconds - start_seconds, 0))


def _is_candidate_process(comm: str, cmdline: List[str]) -> bool:
    comm_l = comm.lower()
    if comm_l in ALLOWED_COMMANDS:
        return True

    if not cmdline:
        return False

    head = Path(cmdline[0]).name.lower()
    return head in ALLOWED_COMMANDS


def _is_excluded_cwd(cwd: str) -> bool:
    for fragment in EXCLUDED_CWD_FRAGMENTS:
        if fragment in cwd:
            return True
    return False


def scan_processes(min_etimes_seconds: int = 15) -> List[ScannedProcess]:
    results: List[ScannedProcess] = []
    uptime_seconds = read_uptime_seconds()

    for pid in list_pids():
        comm = read_process_comm(pid)
        if not comm:
            continue

        cwd = read_process_cwd(pid)
        if not cwd:
            continue

        if _is_excluded_cwd(cwd):
            continue

        cmdline = read_process_cmdline(pid)

        etimes = _read_etimes_seconds(pid, uptime_seconds)
        if etimes is None or etimes < min_etimes_seconds:
            continue

        if not _is_candidate_process(comm, cmdline):
            continue

        results.append(
            ScannedProcess(
                pid=int(pid),
                comm=comm,
                cmdline=cmdline,
                cwd=cwd,
                etimes=etimes,
                file_path=None,
                port=None,
                npm_mode=None,
            )
        )

    return results
