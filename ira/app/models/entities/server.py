from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, JSON
from sqlmodel import Field, SQLModel


class Server(SQLModel, table=True):
    __tablename__ = "servers"

    id: str = Field(primary_key=True)
    hostname: str
    display_name: Optional[str] = None
    ip_address: Optional[str] = None
    ira_version: Optional[str] = None
    agent_base_url: Optional[str] = None
    environment: Optional[str] = None
    capabilities: list[str] | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    status: str = "online"
    last_seen_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
