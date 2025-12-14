"""Get information about top processes."""

import pwd
from app.core.logger import get_logger
from app.modules.processes.top.base import PROC_PATH

logger = get_logger(__name__)


def get_process_user(pid: str) -> str:
    """
    Return the username that owns the given process.

    The information is obtained from ``/proc/<pid>`` and the system
    user database (via :mod:`pwd`).

    :param pid: Process identifier as a string.
    :return: Username that owns the process, or ``\"unknown\"`` if it
        cannot be resolved.
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

    The value is read from ``/proc/<pid>/stat`` (third field).

    :param pid: Process identifier as a string.
    :return: Single-letter process state code, or ``\"?\"`` on failure.
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

    :param value: One-letter STAT code (for example ``\"R\"`` or ``\"S\"``).
    :return: Human-readable description such as ``\"Running\"`` or
        ``\"Sleeping\"``; ``\"Unknown\"`` if the code is not mapped.
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

    The value is taken from the ``Threads:`` entry in
    ``/proc/<pid>/status``.

    :param pid: Process identifier as a string.
    :return: Number of threads for the process, or ``0`` if it cannot
        be determined.
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

    The nice value is read from ``/proc/<pid>/stat`` (19th field,
    zero-based index 18).

    :param pid: Process identifier as a string.
    :return: Nice value, or ``0`` if it cannot be determined.
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

    The SID is read from ``/proc/<pid>/stat`` (sixth field,
    zero-based index 5).

    :param pid: Process identifier as a string.
    :return: Session ID, or ``-1`` if it cannot be determined.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[5])
    except Exception:
        return -1


def get_process_ppid(pid: str) -> int:
    """
    Return the parent process ID (PPID) of the process.

    The PPID is read from ``/proc/<pid>/stat`` (fourth field,
    zero-based index 3).

    :param pid: Process identifier as a string.
    :return: Parent process ID, or ``-1`` if it cannot be determined.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[3])
    except Exception:
        return -1


def get_process_priority(pid: str) -> int:
    """
    Return the scheduling priority (PRI) of the process.

    The priority is read from ``/proc/<pid>/stat`` (18th field,
    zero-based index 17).

    :param pid: Process identifier as a string.
    :return: Scheduling priority, or ``-1`` if it cannot be determined.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            return int(f.readline().split()[17])
    except Exception:
        return -1
