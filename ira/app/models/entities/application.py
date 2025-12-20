from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class Application(SQLModel, table=True):
    __tablename__ = "applications" # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    kind: str
    identifier: str = Field(unique=True)
    name: str

    workdir: str
    file_path: Optional[str] = None
    port: Optional[int] = None
    pid: Optional[int] = None

    status: str
    enabled: bool = False

    last_seen_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
