"""
System-wide memory information helpers.
"""

from typing import Literal

from app.modules.processes.top.base import PROC_PATH

MemoryUnit = Literal["kb", "mb", "gb"]


def get_total_memory(unit: MemoryUnit = "kb") -> int:
    """
    Return total system memory in the requested unit.

    The value is read from ``/proc/meminfo`` (``MemTotal`` entry),
    which is expressed in kilobytes by the kernel.

    :param unit: Target unit for the result: ``\"kb\"`` (default),
        ``\"mb\"`` or ``\"gb\"``.
    :return: Total system memory converted to the requested unit. On
        failure, ``0`` is returned.
    """
    try:
        with (PROC_PATH / "meminfo").open() as f:
            for line in f:
                if line.startswith("MemTotal:"):
                    value_kb = int(line.split()[1])
                    if unit == "kb":
                        return value_kb
                    if unit == "mb":
                        return value_kb // 1024
                    if unit == "gb":
                        return value_kb // (1024 * 1024)
    except Exception:
        pass

    return 0


def get_total_memory_kb() -> int:
    """
    Return total system memory in kilobytes.

    This is a convenience wrapper around :func:`get_total_memory` that
    always returns the value in kilobytes.
    """
    return get_total_memory("kb")

def get_total_memory_mb() -> int:
    """
    Return total system memory in megabytes.

    This is a convenience wrapper around :func:`get_total_memory` that
    always returns the value in megabytes.
    """
    return get_total_memory("mb")

def get_total_memory_gb() -> int:
    """
    Return total system memory in gigabytes.

    This is a convenience wrapper around :func:`get_total_memory` that
    always returns the value in gigabytes.
    """
    return get_total_memory("gb")
