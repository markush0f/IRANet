from datetime import datetime, timezone
from typing import Dict, List

from sqlmodel.ext.asyncio.session import AsyncSession

from app.modules.processes.top.system import load_average
from app.modules.system.cpu import get_cpu_global_top_percent
from app.modules.system.meminfo import read_memory_and_swap_status
from app.repositories.metric_point import MetricPointRepository


class SystemMetricsService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = MetricPointRepository(session)

    def _build_cpu_metrics(
        self,
        ts: datetime,
        host: str,
    ) -> List[dict]:
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

    def _build_memory_metrics(
        self,
        ts: datetime,
        host: str,
    ) -> List[dict]:
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

    def _build_load_metrics(
        self,
        ts: datetime,
        host: str,
    ) -> List[dict]:
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

    async def collect_metrics(
        self,
        *,
        host: str,
    ) -> List[Dict[str, float]]:
        ts = datetime.now(timezone.utc)

        rows: List[Dict[str, float]] = []
        rows.extend(self._build_cpu_metrics(ts, host))
        rows.extend(self._build_memory_metrics(ts, host))
        rows.extend(self._build_load_metrics(ts, host))

        await self._repo.bulk_insert(rows)

        return rows

    async def get_series(
        self,
        *,
        metric: str,
        host: str,
        ts_from: datetime,
        ts_to: datetime,
    ) -> List[Dict]:
        if ts_from >= ts_to:
            raise ValueError("ts_from must be earlier than ts_to")

        rows = await self._repo.list_series(
            metric=metric,
            host=host,
            ts_from=ts_from,
            ts_to=ts_to,
        )

        return [
            {
                "ts": ts,
                "value": value,
            }
            for ts, value in rows
        ]
