from typing import Sequence, Tuple
from datetime import datetime, timezone

from sqlalchemy import desc, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.system_alert import SystemAlert


class SystemAlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_system_alerts(
        self,
        *,
        limit: int,
        offset: int,
        server_id: str | None = None,
    ) -> Tuple[Sequence[SystemAlert], int]:
        stmt = select(SystemAlert)
        if server_id is not None:
            stmt = stmt.where(SystemAlert.server_id == server_id)
        stmt = stmt.order_by(SystemAlert.last_seen_at.desc()).offset(offset).limit(limit)
        result = await self._session.exec(stmt)
        alerts = result.all()

        count_stmt = select(func.count()).select_from(SystemAlert)
        if server_id is not None:
            count_stmt = count_stmt.where(SystemAlert.server_id == server_id)
        total_result = await self._session.exec(count_stmt)
        total = total_result.one()

        return alerts, total

    async def insert_critical(
        self,
        *,
        host: str,
        server_id: str,
        metric: str,
        level: str,
        value: float,
        threshold: float,
        message: str,
    ) -> SystemAlert:
        now = datetime.now(timezone.utc)

        alert = SystemAlert(
            host=host,
            server_id=server_id,
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
