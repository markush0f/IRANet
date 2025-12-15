from typing import Dict, Any
import os
import time

from app.modules.system.proc import read_load_average
from app.modules.system.meminfo import read_memory_and_swap_status


def build_system_alerts_snapshot() -> Dict[str, Any]:
    """
    Build a system alerts snapshot.

    This snapshot evaluates system metrics and exposes boolean flags
    so the frontend does not need to interpret raw values.
    """
    timestamp = int(time.time())

    load = read_load_average()
    memory_status = read_memory_and_swap_status()

    cpu_cores = os.cpu_count() or 1

    # If in 1 minute load average exceeds number of CPU cores, consider it high load
    high_load = load["load_1m"] > cpu_cores
    
    memory_pressure = memory_status["memory"]["pressure"] != "ok"
    swap_active = memory_status["swap"]["state"] == "active"

    return {
        "timestamp": timestamp,
        "alerts": {
            "high_load": high_load,
            "memory_pressure": memory_pressure,
            "swap_active": swap_active,
        },
    }
