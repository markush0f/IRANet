from typing import Dict, Any
import time

from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import read_memory_and_swap_status


def build_system_resources_snapshot() -> Dict[str, Any]:
    """
    Build a lightweight system resources snapshot.

    This snapshot is optimized for frequent polling and real-time
    visualizations (CPU, memory and swap usage).
    """
    timestamp = int(time.time())
    memory_status = read_memory_and_swap_status()

    return {
        "timestamp": timestamp,
        "cpu": get_cpu_global_top_percent(),
        "memory": memory_status["memory"],
        "swap": memory_status["swap"],
    }
