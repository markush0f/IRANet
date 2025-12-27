import json

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from uuid import UUID

from app.extensions.ai_chat.core.chat_service import ServerChatService
from app.extensions.ai_chat.core.initializer import get_chat_service
from app.core.database import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from app.extensions.ai_chat.services.chat_storage_service import ChatStorageService


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    chat_id: UUID
    question: str


class CreateChatRequest(BaseModel):
    title: str | None = None
    server_id: str | None = None


class UpdateChatRequest(BaseModel):
    title: str | None = None


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/create")
async def create_chat(
    payload: CreateChatRequest,
    session: AsyncSession = Depends(get_session),
):
    service = ChatStorageService(session)
    chat = await service.create_chat(
        title=payload.title,
        server_id=payload.server_id,
    )
    return {
        "id": chat.id,
        "title": chat.title,
        "server_id": chat.server_id,
        "created_at": chat.created_at,
    }


@router.put("/{chat_id}")
async def update_chat(
    chat_id: UUID,
    payload: UpdateChatRequest,
    session: AsyncSession = Depends(get_session),
):
    service = ChatStorageService(session)
    chat = await service.update_chat_title(
        chat_id=chat_id,
        title=payload.title,
    )
    if chat is None:
        raise HTTPException(status_code=404, detail="chat_not_found")
    return {
        "id": chat.id,
        "title": chat.title,
        "server_id": chat.server_id,
        "created_at": chat.created_at,
    }


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    service = ChatStorageService(session)
    deleted = await service.delete_chat(chat_id=chat_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="chat_not_found")
    return {"deleted": True}


@router.get("/")
async def list_chats(
    session: AsyncSession = Depends(get_session),
):
    service = ChatStorageService(session)
    chats = await service.list_chats()
    return [
        {
            "id": chat.id,
            "title": chat.title,
            "server_id": chat.server_id,
            "created_at": chat.created_at,
        }
        for chat in chats
    ]


@router.get("/{chat_id}")
async def get_chat(
    chat_id: UUID,
    page: int = Query(1, ge=1),
    session: AsyncSession = Depends(get_session),
):
    service = ChatStorageService(session)
    page_size = 20
    offset = (page - 1) * page_size
    chat, messages = await service.get_chat_with_messages(
        chat_id=chat_id,
        limit=page_size,
        offset=offset,
    )
    if chat is None:
        raise HTTPException(status_code=404, detail="chat_not_found")
    return {
        "id": chat.id,
        "title": chat.title,
        "server_id": chat.server_id,
        "created_at": chat.created_at,
        "page": page,
        "page_size": page_size,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at,
            }
            for msg in messages
        ],
    }


@router.post("/ask")
async def ask_chat(
    payload: ChatRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        storage_service = ChatStorageService(session)
        await storage_service.add_message(
            chat_id=payload.chat_id,
            role="user",
            content=payload.question,
        )

        chat_service = get_chat_service()
        response = await chat_service.ask(question=payload.question)
        await storage_service.add_message(
            chat_id=payload.chat_id,
            role="assistant",
            content=json.dumps(response),
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
