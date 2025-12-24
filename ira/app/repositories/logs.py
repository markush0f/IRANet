from typing import Sequence
from uuid import UUID
from datetime import datetime, timezone

from psycopg2 import IntegrityError
from sqlalchemy import column, asc
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.application_log import ApplicationLog


class ApplicationLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_application(
        self,
        *,
        application_id: UUID,
    ) -> Sequence[ApplicationLog]:
        result = await self._session.exec(
            select(ApplicationLog)
            .where(ApplicationLog.application_id == application_id)
            .order_by(asc(column("created_at")))
        )
        return result.all()

    async def list_active_paths(
        self,
        *,
        application_id: UUID,
    ) -> Sequence[str]:
        result = await self._session.exec(
            select(ApplicationLog.path)
            .where(
                ApplicationLog.application_id == application_id,
                column("enabled").is_(True),
                column("discovered").is_(True),
            )
            .order_by(asc(column("created_at")))
        )
        return result.all()

    async def insert(
        self,
        *,
        application_id: UUID,
        path: str,
        discovered: bool = True,
        enabled: bool = True,
    ) -> None:
        stmt = (
            insert(ApplicationLog)
            .values(
                application_id=application_id,
                path=path,
                discovered=discovered,
                enabled=enabled,
                created_at=datetime.now(timezone.utc),
            )
            .on_conflict_do_nothing(index_elements=["application_id", "path"])
        )

        await self._session.exec(stmt)
        await self._session.commit()

    async def insert_if_not_exists(
        self,
        *,
        application_id: UUID,
        path: str,
        discovered: bool,
        enabled: bool,
    ) -> bool:
        log = ApplicationLog(
            application_id=application_id,
            path=path,
            discovered=discovered,
            enabled=enabled,
        )

        self._session.add(log)

        try:
            await self._session.commit()
            return True
        except IntegrityError:
            await self._session.rollback()
            return False