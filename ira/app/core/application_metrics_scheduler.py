from __future__ import annotations

import asyncio
from datetime import datetime

from sqlmodel import select

from app.core.database import AsyncSessionLocal
from app.core.logger import get_logger
from app.models.dto.application_metrics_create_dto import ApplicationMetricsCreateDTO
from app.models.entities.application import Application
from app.services.applications.applications_metrics import ApplicationMetricsService


COLLECT_INTERVAL_SECONDS = 5

logger = get_logger(__name__)


async def application_metrics_scheduler() -> None:
    logger.info("starting application metrics scheduler")

    while True:
        try:
            now = datetime.utcnow()

            async with AsyncSessionLocal() as session:
                service = ApplicationMetricsService(session)

                statement = (
                    select(Application)
                    .where(
                        Application.enabled.is_(True),
                    )
                )

                applications = (await session.exec(statement)).all()

                metrics_batch: list[ApplicationMetricsCreateDTO] = []

                for application in applications:
                    try:
                        raw_metrics = await collect_application_metrics(
                            application=application,
                        )

                        if raw_metrics is None:
                            continue

                        metrics_batch.append(
                            ApplicationMetricsCreate(
                                application_id=application.id,
                                cpu_percent=raw_metrics.cpu_percent,
                                memory_mb=raw_metrics.memory_mb,
                                memory_percent=raw_metrics.memory_percent,
                                uptime_seconds=raw_metrics.uptime_seconds,
                                threads=raw_metrics.threads,
                                restart_count=raw_metrics.restart_count,
                                status=raw_metrics.status,
                            )
                        )

                    except Exception:
                        logger.exception(
                            "failed collecting metrics for application %s",
                            application.identifier,
                        )

                service.store_metrics_bulk(
                    metrics=metrics_batch,
                    ts=now,
                )

        except Exception:
            logger.exception("application metrics scheduler tick failed")

        await asyncio.sleep(COLLECT_INTERVAL_SECONDS)
