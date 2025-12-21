from datetime import datetime
from typing import Dict, Optional, Sequence, Tuple, List

from sqlalchemy import text
from sqlalchemy import column, asc
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.sql_loader import load_sql
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

    async def list_packet_loss_events(
        self,
        *,
        host: str,
        ts_from: datetime,
        ts_to: datetime,
    ) -> List[Dict]:
        """
        Return aggregated packet loss events for a host within a time range.

        This method identifies contiguous periods where the packet loss metric
        (`net.packet_loss.percent`) is greater than zero and groups them into
        logical events.

        An event starts when the packet loss value transitions from 0 (or NULL)
        to a value greater than 0, and ends when it returns to 0.

        For each detected event, the following information is returned:
        - event start timestamp
        - event end timestamp
        - event duration in seconds
        - maximum packet loss percentage during the event
        - average packet loss percentage during the event

        The underlying SQL query uses window functions (LAG, SUM OVER)
        to detect event boundaries and aggregate metrics efficiently
        at the database level.

        Parameters:
            host (str): Host identifier to filter packet loss events.
            ts_from (datetime): Start of the time range (inclusive).
            ts_to (datetime): End of the time range (inclusive).

        Returns:
            List[Dict]: A list of packet loss events, each with the following keys:
                - start (datetime): Event start timestamp.
                - end (datetime): Event end timestamp.
                - duration_seconds (float): Event duration in seconds.
                - max_percent (float): Maximum packet loss percentage in the event.
                - avg_percent (float): Average packet loss percentage in the event.
        """
        sql = load_sql("app/sql/internet/packet_loss_events.sql")

        result = await self._session.execute(
            text(sql),
            {
                "host": host,
                "ts_from": ts_from,
                "ts_to": ts_to,
            },
        )

        return [
            {
                "start": row.event_start,
                "end": row.event_end,
                "duration_seconds": row.duration_seconds,
                "max_percent": row.max_packet_loss_percent,
                "avg_percent": row.avg_packet_loss_percent,
            }
            for row in result
        ]

    async def get_last_metric(
        self,
        *,
        host: str,
        metric: str,
        limit: int = 1,
    ) -> Optional[MetricPoint]:
        result = await self._session.exec(
            select(MetricPoint)
            .where(
                MetricPoint.host == host,
                MetricPoint.metric == metric,
            )
            .order_by(MetricPoint.ts.desc())  # type: ignore
            .limit(limit)
        )

        return result.first()

    async def get_limit_metrics(
        self,
        *,
        host: str,
        metric: str,
        limit: int,
    ) -> Sequence[MetricPoint]:
        result = await self._session.exec(
            select(MetricPoint)
            .where(
                MetricPoint.host == host,
                MetricPoint.metric == metric,
            )
            .order_by(MetricPoint.ts.desc())  # type: ignore
            .limit(limit)
        )

        return result.all()
