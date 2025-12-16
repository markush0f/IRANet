import asyncio
from typing import Optional

from app.infrastructure.metrics.collector import collect_metrics



_collector_task: Optional[asyncio.Task] = None


async def _collector_loop(host: str, interval: int) -> None:
    while True:
        try:
            await collect_metrics(host)
        except Exception:
            pass

        await asyncio.sleep(interval)


def start_metrics_collector(host: str, interval: int) -> None:
    global _collector_task

    if _collector_task is None:
        _collector_task = asyncio.create_task(
            _collector_loop(host, interval)
        )


def stop_metrics_collector() -> None:
    global _collector_task

    if _collector_task:
        _collector_task.cancel()
        _collector_task = None
