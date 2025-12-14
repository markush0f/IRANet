"""Get information about top processes."""

import pwd
from app.core.logger import get_logger
from app.modules.processes.top.base import PROC_PATH

logger = get_logger(__name__)


def get_process_user(pid: str) -> str:
    """
    Return the username that owns the given process.
    """
    try:
        stat = (PROC_PATH / pid).stat()
        username = pwd.getpwuid(stat.st_uid).pw_name
        logger.debug("Resolved user for pid %s: %s", pid, username)
        return username
    except Exception as exc:
        logger.debug("Unable to resolve user for pid %s: %s", pid, exc)
        return "unknown"


def get_process_state(pid: str) -> str:
    """
    Return the process state (STAT) for a given PID.

    Possible values:
    R (running), S (sleeping), D (uninterruptible sleep),
    T (stopped), Z (zombie), I (idle).
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            state = f.readline().split()[2]
        logger.debug("Resolved state for pid %s: %s", pid, state)
        return str(state)
    except Exception as exc:
        logger.debug("Unable to resolve state for pid %s: %s", pid, exc)
        return "?"


def get_process_state_extended(value: str) -> str:
    """
    Return a more descriptive process state based on STAT value.
    """
    state_map = {
        "R": "Running",
        "S": "Sleeping",
        "D": "Uninterruptible Sleep",
        "T": "Stopped",
        "Z": "Zombie",
        "I": "Idle",
    }
    extended = state_map.get(value, "Unknown")
    logger.debug("Extended state for value %s: %s", value, extended)
    return str(extended)


def get_process_threads(pid: str) -> int:
    """
    Return the number of threads of the given process.
    """
    try:
        with (PROC_PATH / pid / "status").open() as f:
            for line in f:
                if line.startswith("Threads:"):
                    return int(line.split()[1])
    except Exception:
        pass
    return 0


def get_process_nice(pid: str) -> int:
    """
    Return the nice value of the process.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[18])
    except Exception:
        return 0


def get_process_session_id(
    pid: str,
) -> int:
    """
    Return the session ID (SID) of the process.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[5])
    except Exception:
        return -1


def get_process_ppid(pid: str) -> int:
    """
    Return the parent process ID (PPID) of the process.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[3])
    except Exception:
        return -1


def get_process_priority(pid: str) -> int:
    """
    Return the scheduling priority (PRI) of the process.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[17])
    except Exception:
        return -1
