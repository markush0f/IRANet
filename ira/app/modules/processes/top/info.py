"""Get information about top processes."""

from pathlib import Path
import pwd

from app.core.logger import get_logger

PROC_PATH = Path("/proc")

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
