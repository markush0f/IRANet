import os
from pathlib import Path
from typing import Iterator

PROC_PATH = Path("/proc")
CLK_TCK = 100  # Linux default
PASSWD_FILE = Path("/etc/passwd")


def iter_pids() -> Iterator[str]:
    """Yield numeric PIDs found under /proc."""
    return filter(str.isdigit, os.listdir(PROC_PATH))


def read_process_memory(pid: str) -> int:
    """
    Get the resident memory (RAM) used by a process.

    :param pid: Process identifier as a string.
    :return: Memory in kilobytes, or 0 if not found.
    """
    with (PROC_PATH / pid / "status").open() as f:
        for line in f:
            if line.startswith("VmRSS:"):
                return int(line.split()[1])
    return 0


def read_process_name(pid: str) -> str:
    """
    Read the process name from /proc/<pid>/comm.

    :param pid: Process identifier as a string.
    :return: Process name or 'unknown' on failure.
    """
    try:
        return (PROC_PATH / pid / "comm").read_text().strip()
    except Exception:
        return "unknown"

