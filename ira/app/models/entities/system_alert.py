from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class SystemAlert(SQLModel, table=True):
    __tablename__ = "system_alerts"# type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    host: str
    metric: str
    level: str

    value: float
    threshold: float

    status: str
    message: str

    first_seen_at: datetime
    last_seen_at: datetime
    resolved_at: Optional[datetime] = None
