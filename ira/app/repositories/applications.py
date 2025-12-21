from typing import Optional, Sequence
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, exists

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.application import Application
from app.models.entities.application_log import ApplicationLog


class ApplicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_identifier(
        self,
        identifier: str,
    ) -> Optional[Application]:
        result = await self._session.exec(
            select(Application).where(Application.identifier == identifier)
        )
        return result.first()

    async def list_all(
        self,
    ) -> Sequence[Application]:
        result = await self._session.exec(
            select(Application).order_by(Application.created_at.desc())  # type: ignore
        )
        return result.all()

    async def create(
        self,
        *,
        kind: str,
        identifier: str,
        name: str,
        workdir: str,
        file_path: Optional[str] = None,
        port: Optional[int] = None,
        enabled: bool = False,
        status: str = "running",
    ) -> Application:
        app = Application(
            kind=kind,
            identifier=identifier,
            name=name,
            workdir=workdir,
            file_path=file_path,
            port=port,
            enabled=enabled,
            status=status,
            created_at=datetime.now(timezone.utc),
        )

        self._session.add(app)
        await self._session.commit()
        await self._session.refresh(app)

        return app

    async def update_runtime_state(
        self,
        *,
        application_id: UUID,
        status: str,
        pid: Optional[int],
    ) -> None:
        result = await self._session.exec(
            select(Application).where(Application.id == application_id)
        )
        app = result.first()

        if not app:
            return

        app.status = status
        app.pid = pid
        app.last_seen_at = datetime.now(timezone.utc)

        self._session.add(app)
        await self._session.commit()

    async def applications_with_path_logs(
    self,
    ) -> Sequence[Application]:
        stmt = (
            select(Application)
            .where(
                select(ApplicationLog.application_id)
                .where(ApplicationLog.application_id == Application.id)
                .exists()
            )
        )

        result = await self._session.exec(stmt)
        return result.all()
