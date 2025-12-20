from __future__ import annotations

import asyncio
import os
import socket

from app.core.database import AsyncSessionLocal
from app.core.logger import get_logger
from app.services.metrics_service import SystemMetricsService
from app.services.system_alerts_service import SystemAlertsService

COLLECT_INTERVAL_SECONDS = 5

logger = get_logger(__name__)


async def metrics_scheduler() -> None:
    host = socket.gethostname()
    cpu_cores = os.cpu_count() or 1

    logger.info("starting metrics scheduler for host %s", host)

    while True:
        try:
            logger.debug("collecting metrics batch for host %s", host)

            async with AsyncSessionLocal() as session:
                alerts_service = SystemAlertsService(session)
                metrics_service = SystemMetricsService(session)

                points = await metrics_service.collect_metrics(host=host)

                metrics: dict[str, float] = {}
                for point in points:
                    metrics[point["metric"]] = point["value"]

                await alerts_service.evaluate_alerts(
                    cpu_total=metrics.get("cpu.total", 0.0),
                    memory_available_percent=metrics.get(
                        "memory.available_percent",
                        100.0,
                    ),
                    load_1m=metrics.get("load.1m", 0.0),
                    cpu_cores=cpu_cores,
                    host=host,
                )

        except Exception:
            logger.exception("metric collection failed for host %s", host)

        await asyncio.sleep(COLLECT_INTERVAL_SECONDS)
