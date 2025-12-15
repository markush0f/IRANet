from typing import Any, Dict
from app.core.logger import get_logger
from app.modules.types.MEMORY_UNIT_TYPE import MemoryUnit
from app.modules.common.base import PROC_PATH


logger = get_logger(__name__)


def read_meminfo_raw() -> Dict[str, int]:
    meminfo: Dict[str, int] = {}

    logger.debug("Reading raw meminfo from %s", PROC_PATH / "meminfo")

    with (PROC_PATH / "meminfo").open() as f:
        for line in f:
            key, value = line.split(":")
            meminfo[key] = int(value.strip().split()[0])

    return meminfo


def read_memory_info(
    meminfo: Dict[str, int] | None = None,
) -> Dict[str, Any]:
    """
    Retrieve system memory information from ``/proc/meminfo``.

    It iterates over all lines of the file, building a dictionary with
    the numeric values (in kilobytes) reported by the kernel, and then
    computes total, used and available memory.

    Returns:
        Dict[str, Any]: Dictionary with the keys ``"total_kb"``,
        ``"used_kb"`` and ``"free_kb"``, representing respectively total,
        used and free memory in kilobytes.
    """
    if meminfo is None:
        meminfo = read_meminfo_raw()

    total = meminfo.get("MemTotal", 0)
    free = meminfo.get("MemAvailable", 0)

    used = max(total - free, 0)

    return {
        "total_kb": total,
        "used_kb": used,
        "free_kb": free,
    }


def read_memory_and_swap_status(
    meminfo: Dict[str, int] | None = None,
) -> Dict[str, Any]:
    if meminfo is None:
        meminfo = read_meminfo_raw()

    mem_total = meminfo.get("MemTotal", 0)
    mem_free = meminfo.get("MemFree", 0)
    mem_available = meminfo.get("MemAvailable", 0)
    buffers = meminfo.get("Buffers", 0)
    cached = meminfo.get("Cached", 0)

    mem_used = max(mem_total - mem_free - buffers - cached, 0)

    swap_total = meminfo.get("SwapTotal", 0)
    swap_free = meminfo.get("SwapFree", 0)
    swap_used = max(swap_total - swap_free, 0)

    available_percent = (
        round((mem_available / mem_total) * 100, 2) if mem_total > 0 else 0.0
    )

    if available_percent < 5:
        pressure = "critical"
    elif available_percent < 10:
        pressure = "pressure"
    else:
        pressure = "ok"

    if swap_total == 0:
        swap_state = "disabled"
    elif swap_used == 0:
        swap_state = "unused"
    else:
        swap_state = "active"

    return {
        "memory": {
            "total_kb": mem_total,
            "used_kb": mem_used,
            "free_kb": mem_free,
            "buffers_kb": buffers,
            "cached_kb": cached,
            "available_kb": mem_available,
            "available_percent": available_percent,
            "pressure": pressure,
        },
        "swap": {
            "total_kb": swap_total,
            "used_kb": swap_used,
            "free_kb": swap_free,
            "state": swap_state,
        },
    }


def get_total_memory(
    unit: MemoryUnit = "kb",
    meminfo: Dict[str, int] | None = None,
) -> int:
    """
    Return total system memory in the requested unit.

    The value is read from ``/proc/meminfo`` (``MemTotal`` entry),
    which is expressed in kilobytes by the kernel.

    :param unit: Target unit for the result: ``\"kb\"`` (default),
        ``\"mb\"`` or ``\"gb\"``.
    :return: Total system memory converted to the requested unit. On
        failure, ``0`` is returned.
    """
    if meminfo is None:
        meminfo = read_meminfo_raw()

    value_kb = meminfo.get("MemTotal", 0)

    if unit == "kb":
        return value_kb
    if unit == "mb":
        return value_kb // 1024
    if unit == "gb":
        return value_kb // (1024 * 1024)

    return value_kb
