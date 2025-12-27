from app.repositories.extensions import ExtensionsRepository
from app.extensions.ai_chat.tools.registry import tool_class
from app.services.extensions.extensions_registry import INSTALLER, UNINSTALLER
from app.core.logger import get_logger


# @tool_class(name_prefix="extensions")
class ExtensionsService:
    def __init__(self, session):
        self._repository = ExtensionsRepository(session)
        self._logger = get_logger(__name__)

    async def extension_is_enabled(self, *, extension_id: str) -> bool:
        return await self._repository.is_enabled(extension_id)

    async def get_all_extensions(
        self,
    ):
        return await self._repository.get_all_extensions()

    async def get_extension_by_id(
        self,
        *,
        extension_id: str,
    ):
        return await self._repository.get_by_id(
            extension_id=extension_id,
        )

    
    async def set_extension_enabled(
        self,
        *,
        extension_id: str,
        enabled: bool,
    ):
        return await self._repository.set_enabled(
            extension_id=extension_id,
            enabled=enabled,
        )

    async def enable_extension(
        self,
        *,
        extension_id: str,
    ):
        installer = INSTALLER.get(extension_id)
        if installer:
            self._logger.info("Installing extension: %s", extension_id)
            installer.main()
        return await self.set_extension_enabled(
            extension_id=extension_id,
            enabled=True,
        )

    async def disable_extension(
        self,
        *,
        extension_id: str,
    ):
        uninstaller = UNINSTALLER.get(extension_id)
        if uninstaller:
            self._logger.info("Uninstalling extension: %s", extension_id)
            uninstaller.main()
        return await self.set_extension_enabled(
            extension_id=extension_id,
            enabled=False,
        )
