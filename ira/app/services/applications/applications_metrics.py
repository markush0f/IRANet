# app/services/application_metrics/service.py

from datetime import datetime
from typing import Iterable
from uuid import UUID

from sqlmodel import Session, select

from app.models.dto.application_metrics_create_dto import ApplicationMetricsCreateDTO
from app.models.entities.application import Application
from app.models.entities.application_metrics import ApplicationMetrics
from app.repositories.application_metrics_repository import (
    ApplicationMetricssRepository,
)


class ApplicationMetricsService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = ApplicationMetricssRepository(session)

    def store_metric(self, metric: ApplicationMetricsCreateDTO) -> None:
        application = self._get_enabled_application(metric.application_id)

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

        self._repo.insert(db_metric)

    def store_metrics_bulk(
        self,
        *,
        metrics: Iterable[ApplicationMetricsCreateDTO],
        ts: datetime,
    ) -> None:
        metrics_list = list(metrics)
        if not metrics_list:
            return

        application_ids = {m.application_id for m in metrics_list}
        applications = self._get_enabled_applications(application_ids)

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

        self._repo.insert_many(db_metrics)

    def _get_enabled_application(self, application_id: UUID) -> Application:
        statement = select(Application).where(
            Application.id == application_id,
            Application.enabled.is_(True),  # type: ignore
        )

        return self._session.exec(statement).one()

    def _get_enabled_applications(
        self,
        application_ids: set[UUID],
    ) -> dict[UUID, Application]:
        statement = select(Application).where(
            Application.id.in_(application_ids),  # type: ignore
            Application.enabled.is_(True),  # type: ignore
        )

        result = self._session.exec(statement).all()
        return {app.id: app for app in result}
