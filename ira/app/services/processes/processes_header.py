from app.modules.processes.top.cpu import get_cpu_global_top_percent
from app.modules.processes.top.system import (
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
