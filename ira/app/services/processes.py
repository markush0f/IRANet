"""High-level façade that re-exports specialized process services.

The actual logic lives in dedicated modules:

* :mod:`app.services.processes_cpu`
* :mod:`app.services.processes_memory`
* :mod:`app.services.processes_state`
* :mod:`app.services.processes_table`

This module keeps a stable public API while allowing the internal
implementation to be split by responsibility.
"""

from .processes_cpu import (
    list_top_cpu_processes,
    get_process_cpu_time,
)
from .processes_memory import (
    list_top_memory_processes,
    get_process_memory_virt,
    get_process_memory_res,
    get_process_memory_shared,
    get_process_memory_percent,
)
from .processes_state import (
    get_process_user_info,
    get_process_state_label,
    get_process_stat_field,
    get_process_stat_extended,
    get_process_ppid_info,
    get_process_priority_info,
    get_process_nice_info,
)
from .processes_table import get_processes_table


def get_processes_overview(limit: int = 5):
    """
    Get an overview of the most CPU- and memory-intensive processes.

    The result groups the output of ``top``-like helpers into a single
    structure suitable for JSON responses.

    :param limit: Maximum number of processes to include in each list.
    :return: Dictionary with ``\"top_cpu_processes\"`` and
        ``\"top_memory_processes\"`` keys.
    """
    return {
        "top_cpu_processes": list_top_cpu_processes(limit),
        "top_memory_processes": list_top_memory_processes(limit),
    }

__all__ = [
    # CPU
    "list_top_cpu_processes",
    "get_process_cpu_time",
    # Memory
    "list_top_memory_processes",
    "get_process_memory_virt",
    "get_process_memory_res",
    "get_process_memory_shared",
    "get_process_memory_percent",
    # State / metadata
    "get_process_user_info",
    "get_process_state_label",
    "get_process_stat_field",
    "get_process_stat_extended",
    "get_process_ppid_info",
    "get_process_priority_info",
    "get_process_nice_info",
    # Composite
    "get_processes_table",
    "get_processes_overview",
]
