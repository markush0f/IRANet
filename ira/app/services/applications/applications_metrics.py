from datetime import datetime, timedelta
from typing import Iterable
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.dto.application_metrics_create_dto import (
    ApplicationMetricsCreateDTO,
)
from app.models.entities.application import Application
from app.models.entities.application_metrics import ApplicationMetrics
from app.repositories.application_metrics_repository import (
    ApplicationMetricssRepository,
)

MAX_RANGE = timedelta(hours=6)
DEFAULT_STEP_SECONDS = 5


class ApplicationMetricsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = ApplicationMetricssRepository(session)

    async def store_metric(
        self,
        metric: ApplicationMetricsCreateDTO,
    ) -> None:
        application = await self._get_enabled_application(metric.application_id)

        application.last_seen_at = metric.ts

        db_metric = ApplicationMetrics(
            application_id=metric.application_id,
            ts=metric.ts,
            cpu_percent=metric.cpu_percent,
            memory_mb=metric.memory_mb,
            memory_percent=metric.memory_percent,
            uptime_seconds=metric.uptime_seconds,
            threads=metric.threads,
            restart_count=metric.restart_count,
            status=metric.status,
        )

        await self._repo.insert(db_metric)

    async def store_metrics_bulk(
        self,
        *,
        metrics: Iterable[ApplicationMetricsCreateDTO],
        ts: datetime,
    ) -> None:
        metrics_list = list(metrics)
        if not metrics_list:
            return

        application_ids = {m.application_id for m in metrics_list}
        applications = await self._get_enabled_applications(application_ids)

        db_metrics: list[ApplicationMetrics] = []

        for metric in metrics_list:
            application = applications.get(metric.application_id)
            if not application:
                continue

            application.last_seen_at = ts

            db_metrics.append(
                ApplicationMetrics(
                    application_id=metric.application_id,
                    ts=ts,
                    cpu_percent=metric.cpu_percent,
                    memory_mb=metric.memory_mb,
                    memory_percent=metric.memory_percent,
                    uptime_seconds=metric.uptime_seconds,
                    threads=metric.threads,
                    restart_count=metric.restart_count,
                    status=metric.status,
                )
            )

        await self._repo.insert_many(db_metrics)

    async def list_metrics(
        self,
        *,
        application_id: UUID,
        ts_from: datetime,
        ts_to: datetime,
    ) -> list[dict]:
        rows = await self._repo.list_by_application(
            application_id=application_id,
            start=ts_from,
            end=ts_to,
        )
        return [self._serialize_metric(row) for row in rows]

    async def list_metrics_series(
        self,
        *,
        application_id: UUID,
        ts_from: datetime,
        ts_to: datetime,
        step_seconds: int = DEFAULT_STEP_SECONDS,
    ) -> dict:
        if ts_to <= ts_from:
            raise ValueError("ts_to must be greater than ts_from")

        if ts_to - ts_from > MAX_RANGE:
            raise ValueError(f"time range too large (max {MAX_RANGE})")

        rows = await self._repo.list_by_application(
            application_id=application_id,
            start=ts_from,
            end=ts_to,
        )

        series: dict[str, list[list]] = {
            "cpu_percent": [],
            "memory_mb": [],
            "memory_percent": [],
            "uptime_seconds": [],
            "threads": [],
            "restart_count": [],
            "status": [],
        }

        for row in rows:
            ts = row.ts.isoformat()

            series["status"].append([ts, row.status])

            if row.status != "running":
                for key in series:
                    if key != "status":
                        series[key].append([ts, None])
                continue

            series["cpu_percent"].append([ts, row.cpu_percent])
            series["memory_mb"].append([ts, row.memory_mb])
            series["memory_percent"].append([ts, row.memory_percent])
            series["uptime_seconds"].append([ts, row.uptime_seconds])
            series["threads"].append([ts, row.threads])
            series["restart_count"].append([ts, row.restart_count])

        return {
            "application_id": application_id,
            "range": {
                "from": ts_from.isoformat(),
                "to": ts_to.isoformat(),
                "step_seconds": step_seconds,
                "max_range_seconds": int(MAX_RANGE.total_seconds()),
            },
            "series": series,
        }

    async def list_latest_metrics(
        self,
        *,
        application_id: UUID,
        limit: int = 1,
    ) -> list[dict]:
        rows = await self._repo.list_latest_by_application(
            application_id=application_id,
            limit=limit,
        )
        return [self._serialize_metric(row) for row in rows]

    def _serialize_metric(self, metric: ApplicationMetrics) -> dict:
        return {
            "application_id": metric.application_id,
            "ts": metric.ts,
            "cpu_percent": metric.cpu_percent,
            "memory_mb": metric.memory_mb,
            "memory_percent": metric.memory_percent,
            "uptime_seconds": metric.uptime_seconds,
            "threads": metric.threads,
            "restart_count": metric.restart_count,
            "status": metric.status,
        }

    async def _get_enabled_application(
        self,
        application_id: UUID,
    ) -> Application:
        statement = select(Application).where(
            Application.id == application_id,
            Application.enabled.is_(True),  # type: ignore
        )

        result = await self._session.exec(statement)
        return result.one()

    async def _get_enabled_applications(
        self,
        application_ids: set[UUID],
    ) -> dict[UUID, Application]:
        statement = select(Application).where(
            Application.id.in_(application_ids),  # type: ignore
            Application.enabled.is_(True),  # type: ignore
        )

        result = await self._session.exec(statement)
        applications = result.all()

        return {app.id: app for app in applications}
