# app/repositories/application_metrics_repository.py

from datetime import datetime
from typing import Iterable, Sequence
from uuid import UUID

from sqlmodel import Session, select

from app.models.entities.application_metrics import ApplicationMetrics



class ApplicationMetricssRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def insert(self, metric: ApplicationMetrics) -> None:
        self._session.add(metric)
        self._session.commit()

    def insert_many(self, metrics: Iterable[ApplicationMetrics]) -> None:
        metrics_list = list(metrics)
        if not metrics_list:
            return

        self._session.add_all(metrics_list)
        self._session.commit()

    def list_by_application(
        self,
        *,
        application_id: UUID,
        start: datetime,
        end: datetime,
    ) -> Sequence[ApplicationMetrics]:
        statement = (
            select(ApplicationMetrics)
            .where(
                ApplicationMetrics.application_id == application_id,
                ApplicationMetrics.ts >= start,
                ApplicationMetrics.ts <= end,
            )
            .order_by(ApplicationMetrics.ts.asc())
        )

        result = self._session.exec(statement)
        return result.all()

    def list_latest_by_application(
        self,
        *,
        application_id: UUID,
        limit: int = 1,
    ) -> Sequence[ApplicationMetrics]:
        statement = (
            select(ApplicationMetrics)
            .where(ApplicationMetrics.application_id == application_id)
            .order_by(ApplicationMetrics.ts.desc())
            .limit(limit)
        )

        result = self._session.exec(statement)
        return result.all()
