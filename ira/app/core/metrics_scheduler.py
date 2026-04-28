from __future__ import annotations

import asyncio
import os
import socket


from app.core.config import get_server_id
from app.core.database import AsyncSessionLocal
from app.core.logger import get_logger
from app.repositories.servers import ServerRepository
from app.services.metrics.metrics_service import SystemMetricsService
from app.services.system.system_alerts_service import SystemAlertsService

COLLECT_INTERVAL_SECONDS = 5

IRA_VERSION = "0.1.0"

logger = get_logger(__name__)


def _get_local_ip() -> str | None:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


async def metrics_scheduler() -> None:
    server_id = get_server_id()
    host = socket.gethostname()
    ip_address = _get_local_ip()
    cpu_cores = os.cpu_count() or 1

    logger.info("starting metrics scheduler for server %s (host %s)", server_id, host)

    async with AsyncSessionLocal() as session:
        server_repo = ServerRepository(session)
        await server_repo.upsert(
            server_id=server_id,
            hostname=host,
            ip_address=ip_address,
            ira_version=IRA_VERSION,
        )

    while True:
        try:
            logger.debug("collecting metrics batch for server %s", server_id)

            async with AsyncSessionLocal() as session:
                alerts_service = SystemAlertsService(session)
                metrics_service = SystemMetricsService(session)

                points = await metrics_service.collect_metrics(
                    host=host,
                    server_id=server_id,
                )

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
                    server_id=server_id,
                )

                server_repo = ServerRepository(session)
                await server_repo.update_heartbeat(
                    server_id,
                    ip_address=ip_address,
                    ira_version=IRA_VERSION,
                )

        except Exception:
            logger.exception("metric collection failed for server %s", server_id)

        await asyncio.sleep(COLLECT_INTERVAL_SECONDS)