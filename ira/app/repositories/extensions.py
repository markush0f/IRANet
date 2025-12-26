from typing import Sequence
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.extension import Extension


class ExtensionsRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def is_enabled(self, extension_id: str) -> bool:
        result = await self._session.exec(
            select(Extension.enabled).where(Extension.id == extension_id)
        )
        value = result.one_or_none()
        return bool(value)

    async def get_all_extensions(
        self,
    ) -> Sequence[Extension]:
        result = await self._session.exec(select(Extension))
        return result.all()
