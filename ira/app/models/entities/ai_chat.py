from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, ForeignKey
from sqlmodel import Field, SQLModel


class AiChat(SQLModel, table=True):
    __tablename__ = "ai_chats"  # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    server_id: str | None = None
    title: str | None = None
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=False), nullable=False),
    )


class AiChatMessage(SQLModel, table=True):
    __tablename__ = "ai_chat_messages"  # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    chat_id: UUID = Field(foreign_key="ai_chats.id")
    role: str
    content: str
    content_json: str | None = None
    content_markdown: str | None = None
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=False), nullable=False),
    )
