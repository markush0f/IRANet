from datetime import datetime
from typing import Sequence, Tuple, List

from sqlalchemy import insert, column, asc
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.metric_point import MetricPoint


class MetricPointRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_series(
        self,
        *,
        metric: str,
        host: str,
        ts_from: datetime,
        ts_to: datetime,
    ) -> Sequence[Tuple[datetime, float]]:
        result = await self._session.exec(
            select(MetricPoint.ts, MetricPoint.value)
            .where(
                MetricPoint.metric == metric,
                MetricPoint.host == host,
                column("ts").between(ts_from, ts_to),
            )
            .order_by(asc(column("ts")))
        )

        return [(row[0], float(row[1])) for row in result.all()]

    async def bulk_insert(
        self,
        entities: list[MetricPoint],
    ) -> None:
        if not entities:
            return

        self._session.add_all(entities)
        await self._session.commit()
