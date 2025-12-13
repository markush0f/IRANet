"""
TIME+ is the TOTAL CPU time consumed
by the process(user mode + kernel mode)
since the process started.
"""

from app.modules.processes.top.base import CLK_TCK, PROC_PATH


def get_process_cpu_time(pid: str) -> float:
    """
    Read the CPU time consumed by a specific process.

    :param pid: Process identifier as a string.
    :return: Sum of user and system time (ticks).
    """
    try:
        with (PROC_PATH / pid / "stat").open() as f:
            parts = f.readline().split()
            utime = int(parts[13])
            stime = int(parts[14])
            return (utime + stime) / CLK_TCK
    except Exception:
        return 0.0
