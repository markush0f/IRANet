"""State and metadata services for running processes.

This module groups helpers related to ownership, state and scheduler
metadata for a given process.
"""

from app.core.logger import get_logger

from app.modules.processes.top.state import (
    get_process_nice,
    get_process_ppid,
    get_process_priority,
    get_process_session_id,
    get_process_state,
    get_process_state_extended as get_state_label,
    get_process_threads,
    get_process_user,
)

logger = get_logger(__name__)


def get_process_user_info(pid: str) -> str:
    """
    Return the username that owns the given process.

    :param pid: Process identifier as a string.
    :return: Username associated with the process, or ``\"unknown\"``
        if it cannot be resolved.
    """
    logger.debug("Getting user info for pid %s", pid)
    return get_process_user(pid)


def get_process_state_label(pid: str) -> str:
    """
    Return a human-readable label for the process state.

    :param pid: Process identifier as a string.
    :return: Description of the process state (for example
        ``\"Running\"`` or ``\"Sleeping\"``), or ``\"Unknown\"``.
    """
    logger.debug("Getting state label for pid %s", pid)
    state = get_process_state(pid)
    return get_state_label(state)


def get_process_stat_field(pid: str) -> str:
    """
    Build the short STAT field as shown by tools like ``top``.

    The returned value combines the base process state (R, S, D, etc.)
    with additional flags such as multithreaded, nice priority and
    session leader.

    :param pid: Process identifier as a string.
    :return: STAT field string (for example ``\"R<N\"``) or ``\"?\"``
        if the state cannot be determined.
    """
    logger.debug("Building STAT field for pid %s", pid)
    state = get_process_state(pid)
    if state == "?":
        return "?"

    flags: list[str] = []

    if get_process_threads(pid) > 1:
        flags.append("l")

    nice = get_process_nice(pid)
    if nice < 0:
        flags.append("<")
    elif nice > 0:
        flags.append("N")

    if get_process_session_id(pid) == int(pid):
        flags.append("s")

    return state + "".join(flags)


def get_process_stat_extended(pid: str) -> list[str]:
    """
    Return a list of extended STAT descriptions for a process.

    This breaks down the short STAT field into human-readable phrases
    such as ``\"Running\"``, ``\"Multithreaded\"`` or ``\"Session leader\"``.

    :param pid: Process identifier as a string.
    :return: List of textual descriptions, or ``[\"Unknown\"]`` if the
        state cannot be determined.
    """
    logger.debug("Building extended STAT info for pid %s", pid)
    descriptions: list[str] = []

    state = get_process_state(pid)
    if state == "?":
        return ["Unknown"]

    descriptions.append(get_state_label(state))

    if get_process_threads(pid) > 1:
        descriptions.append("Multithreaded")

    nice = get_process_nice(pid)
    if nice < 0:
        descriptions.append("High priority")
    elif nice > 0:
        descriptions.append("Low priority")

    if get_process_session_id(pid) == int(pid):
        descriptions.append("Session leader")

    return descriptions


def get_process_ppid_info(pid: str) -> int:
    """
    Return the parent process ID (PPID) for a given process.

    :param pid: Process identifier as a string.
    :return: Parent process ID, or ``-1`` if it cannot be determined.
    """
    return get_process_ppid(pid)


def get_process_priority_info(pid: str) -> int:
    """
    Return the scheduling priority (PRI) for a process.

    :param pid: Process identifier as a string.
    :return: Priority value, or ``-1`` if it cannot be determined.
    """
    logger.debug("Getting priority info for pid %s", pid)
    return get_process_priority(pid)


def get_process_nice_info(pid: str) -> int:
    """
    Return the nice value of a process.

    :param pid: Process identifier as a string.
    :return: Nice value, or ``0`` if it cannot be determined.
    """
    logger.debug("Getting nice info for pid %s", pid)
    return get_process_nice(pid)


__all__ = [
    "get_process_user_info",
    "get_process_state_label",
    "get_process_stat_field",
    "get_process_stat_extended",
    "get_process_ppid_info",
    "get_process_priority_info",
    "get_process_nice_info",
]

