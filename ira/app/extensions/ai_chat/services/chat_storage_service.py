from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.logger import get_logger
from app.repositories.ai_chat import AiChatRepository


class ChatStorageService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AiChatRepository(session)
        self._logger = get_logger(__name__)

    async def create_chat(
        self,
        *,
        title: str | None,
        server_id: str | None,
    ):
        chat = await self._repo.create_chat(title=title, server_id=server_id)
        self._logger.info("Created chat %s", chat.id)
        return chat

    async def add_message(
        self,
        *,
        chat_id: UUID,
        role: str,
        content: str,
    ):
        message = await self._repo.create_message(
            chat_id=chat_id,
            role=role,
            content=content,
        )
        self._logger.debug("Stored chat message %s for chat %s", message.id, chat_id)
        return message

    async def list_chats(self):
        chats = await self._repo.list_chats()
        self._logger.debug("Loaded %s chats", len(chats))
        return chats

    async def get_chat_with_messages(
        self,
        *,
        chat_id: UUID,
        limit: int | None = None,
        offset: int | None = None,
    ):
        chat = await self._repo.get_chat(chat_id=chat_id)
        if chat is None:
            self._logger.warning("Chat not found: %s", chat_id)
            return None, []
        messages = await self._repo.list_messages(
            chat_id=chat_id,
            limit=limit,
            offset=offset,
        )
        return chat, messages

    async def update_chat_title(
        self,
        *,
        chat_id: UUID,
        title: str | None,
    ):
        chat = await self._repo.update_chat_title(
            chat_id=chat_id,
            title=title,
        )
        if chat is None:
            self._logger.warning("Chat not found for update: %s", chat_id)
        else:
            self._logger.info("Updated chat title for %s", chat_id)
        return chat

    async def delete_chat(
        self,
        *,
        chat_id: UUID,
    ) -> bool:
        deleted = await self._repo.delete_chat(chat_id=chat_id)
        if deleted:
            self._logger.info("Deleted chat %s", chat_id)
        else:
            self._logger.warning("Chat not found for delete: %s", chat_id)
        return deleted
