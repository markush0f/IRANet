from typing import Sequence, Tuple
from datetime import datetime, timezone

from sqlalchemy import desc, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.system_alert import SystemAlert


class SystemAlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def fetch_paginated(
        self,
        *,
        limit: int,
        offset: int,
    ) -> Tuple[Sequence[SystemAlert], int]:
        result = await self._session.exec(
            select(SystemAlert)
            .order_by(SystemAlert.last_seen_at.desc())  # type: ignore
            .offset(offset)
            .limit(limit)
        )

        alerts = result.all()

        total_result = await self._session.exec(
            select(func.count()).select_from(SystemAlert)
        )
        total = total_result.one()

        return alerts, total

    async def insert_critical(
        self,
        *,
        host: str,
        metric: str,
        level: str,
        value: float,
        threshold: float,
        message: str,
    ) -> SystemAlert:
        now = datetime.now(timezone.utc)

        alert = SystemAlert(
            host=host,
            metric=metric,
            level=level,
            value=value,
            threshold=threshold,
            status="active",
            message=message,
            first_seen_at=now,
            last_seen_at=now,
        )

        self._session.add(alert)
        await self._session.commit()
        await self._session.refresh(alert)

        return alert
