from app.api.system import memory_info
from app.modules.processes.top.cpu import get_cpu_global_top_percent
from app.modules.system.header import (
    get_load_average,
    get_system_uptime_seconds,
    get_tasks_summary_named,
)


def get_system_uptime_formatted() -> str:
    """
    Return system uptime formatted like top (DD days, HH:MM).
    """
    uptime = int(get_system_uptime_seconds())

    days = uptime // 86400
    hours = (uptime % 86400) // 3600
    minutes = (uptime % 3600) // 60

    if days > 0:
        return f"{days} days, {hours:02d}:{minutes:02d}"
    return f"{hours:02d}:{minutes:02d}"


def get_load_average_info() -> dict:
    """Return system load average for 1, 5 and 15 minutes."""
    return get_load_average()


def get_tasks_summary_named_info() -> dict[str, int]:
    """
    Return a summary of system tasks grouped by named states.
    """
    return get_tasks_summary_named()


def get_cpu_global_top_percent_info(interval: float = 0.1) -> dict[str, float]:
    """
    Return global CPU usage percentages (top-like).
    """
    return get_cpu_global_top_percent(interval)


def get_system_header() -> dict:
    """
    Return the full system header information (top-like).
    """

    return {
        "uptime": get_system_uptime_formatted(),
        "load_average": get_load_average(),
        "tasks": get_tasks_summary_named(),
        "cpu": get_cpu_global_top_percent(),
        **get_memory_header(),
    }


def get_memory_header() -> dict:
    """
    Return memory information formatted like top.
    """
    mem = memory_info()

    mem_total = mem.get("MemTotal", 0)
    mem_free = mem.get("MemFree", 0)
    buffers = mem.get("Buffers", 0)
    cached = mem.get("Cached", 0)

    mem_used = max(mem_total - mem_free - buffers - cached, 0)
    buff_cache = buffers + cached

    swap_total = mem.get("SwapTotal", 0)
    swap_free = mem.get("SwapFree", 0)
    swap_used = max(swap_total - swap_free, 0)

    return {
        "memory": {
            "total_kb": mem_total,
            "free_kb": mem_free,
            "used_kb": mem_used,
            "buff_cache_kb": buff_cache,
            "available_kb": mem.get("MemAvailable", 0),
        },
        "swap": {
            "total_kb": swap_total,
            "free_kb": swap_free,
            "used_kb": swap_used,
        },
    }
