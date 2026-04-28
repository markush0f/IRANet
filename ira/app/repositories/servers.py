from datetime import datetime, timezone
from typing import Sequence

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.server import Server


class ServerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert(
        self,
        *,
        server_id: str,
        hostname: str,
        display_name: str | None = None,
        ip_address: str | None = None,
        ira_version: str | None = None,
    ) -> Server:
        result = await self._session.exec(
            select(Server).where(Server.id == server_id)
        )
        server = result.first()

        if server is None:
            server = Server(
                id=server_id,
                hostname=hostname,
                display_name=display_name,
                ip_address=ip_address,
                ira_version=ira_version,
                status="online",
                last_seen_at=datetime.now(timezone.utc),
            )
            self._session.add(server)
        else:
            server.hostname = hostname
            if display_name is not None:
                server.display_name = display_name
            if ip_address is not None:
                server.ip_address = ip_address
            if ira_version is not None:
                server.ira_version = ira_version
            server.last_seen_at = datetime.now(timezone.utc)
            self._session.add(server)

        await self._session.commit()
        await self._session.refresh(server)
        return server

    async def update_heartbeat(
        self,
        server_id: str,
        ip_address: str | None = None,
        ira_version: str | None = None,
    ) -> None:
        result = await self._session.exec(
            select(Server).where(Server.id == server_id)
        )
        server = result.first()
        if server:
            server.last_seen_at = datetime.now(timezone.utc)
            if ip_address is not None:
                server.ip_address = ip_address
            if ira_version is not None:
                server.ira_version = ira_version
            self._session.add(server)
            await self._session.commit()

    async def list_all(self) -> Sequence[Server]:
        result = await self._session.exec(
            select(Server).order_by(Server.created_at.desc())
        )
        return result.all()

    async def get_by_id(self, server_id: str) -> Server | None:
        return await self._session.get(Server, server_id)

    async def update(
        self,
        *,
        server_id: str,
        display_name: str | None = None,
        status: str | None = None,
    ) -> Server | None:
        server = await self._session.get(Server, server_id)
        if not server:
            return None
        if display_name is not None:
            server.display_name = display_name
        if status is not None:
            server.status = status
        self._session.add(server)
        await self._session.commit()
        await self._session.refresh(server)
        return server

    async def delete(self, server_id: str) -> bool:
        server = await self._session.get(Server, server_id)
        if not server:
            return False
        await self._session.delete(server)
        await self._session.commit()
        return True