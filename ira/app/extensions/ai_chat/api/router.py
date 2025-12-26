from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.extensions.ai_chat.core import chat_service
from app.extensions.ai_chat.core.chat_service import ServerChatService
from app.extensions.ai_chat.core.initializer import get_chat_service


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/ask")
async def ask_chat(
    payload: ChatRequest,
):
    try:
        chat_service = get_chat_service()
        return await chat_service.ask(question=payload.question)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
