from app.repositories.extensions import ExtensionsRepository


class ExtensionsService:
    def __init__(self, session):
        self._repository = ExtensionsRepository(session)

    async def extension_is_enabled(self, *, extension_id: str) -> bool:
        return await self._repository.is_enabled(extension_id)

    async def get_all_extensions(
        self,
    ):
        return await self._repository.get_all_extensions()
