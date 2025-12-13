"""
Memory-related process metrics, based on Linux /proc.
"""

from typing import List, Dict, Any

from .base import iter_pids, read_process_memory, read_process_name


def get_top_memory_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get the processes with the highest memory usage.

    :param limit: Maximum number of processes to return.
    :return: List of dicts with pid, name, memory_kb.
    """
    processes = []

    for pid in iter_pids():
        try:
            memory_kb = read_process_memory(pid)
        except Exception:
            continue

        if memory_kb <= 0:
            continue

        processes.append(
            {
                "pid": int(pid),
                "name": read_process_name(pid),
                "memory_kb": memory_kb,
            }
        )

    processes.sort(key=lambda p: p["memory_kb"], reverse=True)
    return processes[:limit]

