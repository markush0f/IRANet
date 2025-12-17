"""Periodic task that orchestrates metric collection."""

from __future__ import annotations

import asyncio
import os
import socket

from app.core.logger import get_logger
from app.infrastructure.metrics.collector import collect_metrics
from app.infrastructure.metrics.storage import insert_metric_points
from app.services.alerts.notify import evaluate_alerts

COLLECT_INTERVAL_SECONDS = 5

logger = get_logger(__name__)


async def metrics_scheduler() -> None:
    """
    Continuously gather metrics until the service shuts down.

    The scheduler records the hostname once and repeatedly delegates to
    :func:`collect_metrics`, waiting for ``COLLECT_INTERVAL_SECONDS`` between
    attempts. Exceptions are logged but do not halt the loop.
    """

    host = socket.gethostname()
    logger.info("starting metrics scheduler for host %s", host)

    while True:
        try:
            logger.debug("collecting metrics batch for host %s", host)
            points = await collect_metrics(host)
            await insert_metric_points(points)
            metrics: dict[str, float] = {}

            for point in points:
                metrics[point["metric"]] = point["value"]

            await evaluate_alerts(
                cpu_total=metrics["cpu.total"],
                memory_available_percent=metrics["memory.available_percent"],
                load_1m=metrics["load.1m"],
                cpu_cores=os.cpu_count() or 1,
                host=host,
            )

        except Exception:
            logger.exception("metric collection failed for host %s", host)
        await asyncio.sleep(COLLECT_INTERVAL_SECONDS)
