import os
import time
from typing import Any, Dict, List

import psutil
from app.modules.processes.top.state import read_tasks_summary_named
from app.modules.processes.top.system import load_average
from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.disk import get_disk_partitions, get_processes_using_mountpoint
from app.modules.system.host import host_info
from app.modules.system.meminfo import read_memory_and_swap_status
from app.modules.system.proc import read_uptime_seconds
from app.modules.system.types import DiskPartition, DiskProcessUsage
from app.extensions.ai_chat.tools.registry import tool_class


@tool_class(name_prefix="system")
class SystemService:
    def build_host_info(self) -> dict:
        return {
            "host": host_info(),
        }

    def _format_uptime(self, seconds: int) -> str:
        """
        Format uptime like top (DD days, HH:MM).
        """
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60

        if days > 0:
            return f"{days} days, {hours:02d}:{minutes:02d}"
        return f"{hours:02d}:{minutes:02d}"

    def build_system_snapshot(
        self,
    ) -> Dict[str, Any]:
        """
        Build a full system snapshot suitable for frontend consumption.

        This snapshot represents a global overview of the system,
        similar to the header shown by the Linux `top` command.
        """
        timestamp = int(time.time())

        uptime_seconds = int(read_uptime_seconds())
        memory_status = read_memory_and_swap_status()

        return {
            "timestamp": timestamp,
            "uptime": {
                "seconds": uptime_seconds,
                "formatted": self._format_uptime(uptime_seconds),
            },
            "load": load_average(),
            "tasks": read_tasks_summary_named(),
            "cpu": {
                "usage": get_cpu_global_top_percent(),
            },
            "memory": memory_status["memory"],
            "swap": memory_status["swap"],
        }

    def build_system_resources_snapshot(
        self,
    ) -> Dict[str, Any]:
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

    def build_system_alerts_snapshot(
        self,
    ) -> Dict[str, Any]:
        """
        Build a system alerts snapshot.

        This snapshot evaluates system metrics and exposes boolean flags
        so the frontend does not need to interpret raw values.
        """
        timestamp = int(time.time())

        load = load_average()
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

    def _resolve_status(self, used_percent: float) -> str:
        WARNING_THRESHOLD = 75.0
        CRITICAL_THRESHOLD = 85.0
        if used_percent >= CRITICAL_THRESHOLD:
            return "critical"
        if used_percent >= WARNING_THRESHOLD:
            return "warning"
        return "ok"

    def get_system_disk(self) -> List[Dict]:
        partitions = get_disk_partitions()
        snapshot: List[Dict] = []

        for partition in partitions:
            snapshot.append(
                {
                    "mountpoint": partition["mountpoint"],
                    "filesystem": partition["filesystem"],
                    "device": partition["device"],
                    "total_bytes": partition["total_bytes"],
                    "used_bytes": partition["used_bytes"],
                    "free_bytes": partition["free_bytes"],
                    "used_percent": partition["used_percent"],
                    "status": self._resolve_status(partition["used_percent"]),
                }
            )

        return snapshot

    def get_disk_processes(
        self,
        mountpoint: str,
        limit: int = 10,
    ) -> List[DiskProcessUsage]:
        return get_processes_using_mountpoint(
            mountpoint=mountpoint,
            limit=limit,
        )

    def get_system_disk_total(
        self,
    ) -> Dict:
        partitions: List[DiskPartition] = get_disk_partitions()

        total_bytes = 0
        free_bytes = 0

        for p in partitions:
            total_bytes += p["total_bytes"]
            free_bytes += p["free_bytes"]

        used_percent = (
            0.0
            if total_bytes == 0
            else ((total_bytes - free_bytes) / total_bytes) * 100
        )

        return {
            "type": "aggregated",
            "total_bytes": total_bytes,
            "free_bytes": free_bytes,
            "used_percent": round(used_percent, 2),
            "partitions_count": len(partitions),
        }


    def get_root_disk_usage(self) -> dict:
        usage = psutil.disk_usage("/")

        return {
            "mountpoint": "/",
            "type": "physical",
            "total_bytes": usage.total,
            "free_bytes": usage.free,
            "used_bytes": usage.used,
            "used_percent": usage.percent,
        }
