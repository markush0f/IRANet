from typing import Sequence
from uuid import UUID

from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.entities.ai_chat import AiChat, AiChatMessage


class AiChatRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_chat(
        self,
        *,
        title: str | None,
        server_id: str | None,
    ) -> AiChat:
        chat = AiChat(title=title, server_id=server_id)
        self._session.add(chat)
        await self._session.commit()
        await self._session.refresh(chat)
        return chat

    async def get_chat(
        self,
        *,
        chat_id: UUID,
    ) -> AiChat | None:
        return await self._session.get(AiChat, chat_id)

    async def update_chat_title(
        self,
        *,
        chat_id: UUID,
        title: str | None,
    ) -> AiChat | None:
        chat = await self._session.get(AiChat, chat_id)
        if chat is None:
            return None
        chat.title = title
        self._session.add(chat)
        await self._session.commit()
        await self._session.refresh(chat)
        return chat

    async def delete_chat(
        self,
        *,
        chat_id: UUID,
    ) -> bool:
        chat = await self._session.get(AiChat, chat_id)
        if chat is None:
            return False
        await self._session.exec(
            delete(AiChatMessage).where(AiChatMessage.chat_id == chat_id)
        )
        await self._session.delete(chat)
        await self._session.commit()
        return True

    async def list_messages(
        self,
        *,
        chat_id: UUID,
        limit: int | None = None,
        offset: int | None = None,
    ) -> Sequence[AiChatMessage]:
        result = await self._session.exec(
            select(AiChatMessage)
            .where(AiChatMessage.chat_id == chat_id)
            .order_by(AiChatMessage.created_at.asc())  # type: ignore
            .limit(limit)
            .offset(offset)
        )
        return result.all()

    async def list_chats(
        self,
    ) -> Sequence[AiChat]:
        result = await self._session.exec(
            select(AiChat).order_by(AiChat.created_at.desc())  # type: ignore
        )
        return result.all()

    async def create_message(
        self,
        *,
        chat_id: UUID,
        role: str,
        content: str,
        content_json: str | None = None,
        content_markdown: str | None = None,
    ) -> AiChatMessage:
        message = AiChatMessage(
            chat_id=chat_id,
            role=role,
            content=content,
            content_json=content_json,
            content_markdown=content_markdown,
        )
        self._session.add(message)
        await self._session.commit()
        await self._session.refresh(message)
        return message
