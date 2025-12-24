from typing import Sequence
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import asc
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.application_log import ApplicationLogPath


class ApplicationLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_application(
        self,
        *,
        application_id: UUID,
    ) -> Sequence[ApplicationLogPath]:
        result = await self._session.exec(
            select(ApplicationLogPath)
            .where(ApplicationLogPath.application_id == application_id)
            .order_by(asc(ApplicationLogPath.created_at))  # type: ignore
        )
        return result.all()

    async def list_active_base_paths(
    self,
    *,
    application_id: UUID,
    ) -> Sequence[str]:
        result = await self._session.exec(
            select(ApplicationLogPath.base_path)
            .where(
                ApplicationLogPath.application_id == application_id,
                ApplicationLogPath.enabled.is_(True),
            )
            .order_by(asc(ApplicationLogPath.created_at))
        )
        return result.all()


    async def insert(
        self,
        *,
        application_id: UUID,
        base_path: str,
        discovered: bool = True,
        enabled: bool = True,
    ) -> None:
        entity = ApplicationLogPath(
            application_id=application_id,
            base_path=base_path,
            discovered=discovered,
            enabled=enabled,
            created_at=datetime.now(timezone.utc),
        )

        self._session.add(entity)
