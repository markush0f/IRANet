from typing import Sequence
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.extension import Extensions


class ExtensionsRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def ensure_many(
        self,
        *,
        extension_ids: Sequence[str],
        enabled_default: bool = False,
    ) -> dict[str, list[str]]:
        ids = sorted({extension_id.strip() for extension_id in extension_ids if extension_id.strip()})
        if not ids:
            return {"detected": [], "created": [], "existing": []}

        result = await self._session.exec(select(Extensions.id).where(Extensions.id.in_(ids)))
        existing = sorted(result.all())
        missing = sorted(set(ids) - set(existing))

        if missing:
            self._session.add_all(
                [Extensions(id=extension_id, enabled=enabled_default) for extension_id in missing]
            )
            await self._session.commit()

        return {"detected": ids, "created": missing, "existing": existing}

    async def is_enabled(self, extension_id: str) -> bool:
        result = await self._session.exec(
            select(Extensions.enabled).where(Extensions.id == extension_id)
        )
        value = result.one_or_none()
        return bool(value)

    async def get_all_extensions(
        self,
    ) -> Sequence[Extensions]:
        result = await self._session.exec(select(Extensions))
        return result.all()

    async def get_by_id(
        self,
        *,
        extension_id: str,
    ) -> Extensions | None:
        return await self._session.get(Extensions, extension_id)

    async def set_enabled(
        self,
        *,
        extension_id: str,
        enabled: bool,
    ) -> Extensions:
        extension = await self._session.get(Extensions, extension_id)

        if extension is None:
            extension = Extensions(id=extension_id, enabled=enabled)
        else:
            extension.enabled = enabled

        self._session.add(extension)
        await self._session.commit()
        await self._session.refresh(extension)

        return extension
