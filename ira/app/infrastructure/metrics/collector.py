"""
Utilities that collect system metrics and persist them.
-- CPU --
cpu.total = Total CPU usage percentage (100 - idle).
cpu.user = CPU consumed by user processes.
cpu.system = CPU used by the kernel.

-- MEMORY --
memory.user_kb = Memory actually used by processes, excluding buffers and cache.
memory.free_kb = Memory completely empty, not even used as cache.
memory.available_percent = Percentage of RAM that the system can free up immediately without 
killing processes.

-- LOAD AVERAGE --
load.1m = Load average over the last minute.
load.5m = Load average over the last 5 minutes.
load.15m = Load average over the last 15 minutes.
"""

from __future__ import annotations

from datetime import datetime, timezone

from typing import List

from app.core.logger import get_logger
from app.infrastructure.metrics.storage import insert_metric_points
from app.modules.processes.top.system import load_average
from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import read_memory_and_swap_status
from app.modules.types.METRIC_POINT import MetricPoint

logger = get_logger(__name__)


def _build_cpu_metrics(ts: datetime, host: str) -> List[MetricPoint]:
    """Build metric points that describe global CPU usage percentages."""
    cpu = get_cpu_global_top_percent()

    return [
        {
            "ts": ts,
            "metric": "cpu.total",
            "value": 100 - cpu["id"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "cpu.user",
            "value": cpu["us"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "cpu.system",
            "value": cpu["sy"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "cpu.idle",
            "value": cpu["id"],
            "host": host,
        },
    ]


def _build_memory_metrics(ts: datetime, host: str) -> List[MetricPoint]:
    """Build metric points that describe memory usage snapshots."""
    mem = read_memory_and_swap_status()["memory"]

    return [
        {
            "ts": ts,
            "metric": "memory.used_kb",
            "value": mem["used_kb"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "memory.free_kb",
            "value": mem["free_kb"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "memory.available_percent",
            "value": mem["available_percent"],
            "host": host,
        },
    ]


def _build_load_metrics(ts: datetime, host: str) -> List[MetricPoint]:
    """Build metric points that describe load average values."""
    load = load_average()

    return [
        {
            "ts": ts,
            "metric": "load.1m",
            "value": load["load_1m"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "load.5m",
            "value": load["load_5m"],
            "host": host,
        },
        {
            "ts": ts,
            "metric": "load.15m",
            "value": load["load_15m"],
            "host": host,
        },
    ]


async def collect_metrics(host: str) -> List[MetricPoint]:
    """Gather CPU, memory and load averages and persist the resulting points."""
    ts = datetime.now(timezone.utc)
    # logger.info("collecting metrics snapshot for host %s", host)

    points: List[MetricPoint] = []
    points.extend(_build_cpu_metrics(ts, host))
    points.extend(_build_memory_metrics(ts, host))
    points.extend(_build_load_metrics(ts, host))

    logger.debug(
        "collected %d metrics points for host %s at %s",
        len(points),
        host,
        ts,
    )

    return points
