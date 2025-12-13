"""
Helpers to read process CPU time (TIME+ style) in different units.

TIME+ is the TOTAL CPU time consumed by the process
(user mode + kernel mode) since the process started.
"""

from app.modules.processes.top.base import CLK_TCK, PROC_PATH


def _read_process_cpu_time_ticks(pid: str) -> int:
    """
    Read the CPU time consumed by a specific process in raw clock ticks.
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            parts = f.readline().split()
            utime = int(parts[13])
            stime = int(parts[14])
            return utime + stime
    except Exception:
        return 0


def _read_process_cpu_time_seconds(pid: str) -> float:
    """
    Read the CPU time consumed by a specific process in seconds.
    """
    return _read_process_cpu_time_ticks(pid) / CLK_TCK


def get_process_cpu_time_ticks(pid: str) -> int:
    """Return total CPU time in clock ticks."""
    return _read_process_cpu_time_ticks(pid)


def get_process_cpu_time_seconds(pid: str) -> float:
    """Return total CPU time in seconds."""
    return _read_process_cpu_time_seconds(pid)


def get_process_cpu_time_milliseconds(pid: str) -> int:
    """Return total CPU time in milliseconds (rounded)."""
    return int(_read_process_cpu_time_seconds(pid) * 1000)


def get_process_cpu_time_minutes(pid: str) -> float:
    """Return total CPU time in minutes."""
    return _read_process_cpu_time_seconds(pid) / 60.0


def get_process_cpu_time_hours(pid: str) -> float:
    """Return total CPU time in hours."""
    return _read_process_cpu_time_seconds(pid) / 3600.0


def get_process_cpu_time_formatted(pid: str) -> str:
    """
    Return total CPU time formatted as HH:MM:SS.
    """
    total_seconds = int(_read_process_cpu_time_seconds(pid))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
