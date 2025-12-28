from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import SQLModel, Field


class ApplicationMetricsCreateDTO(SQLModel):
    application_id: UUID
    ts: datetime = Field(default_factory=datetime.utcnow)

    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    memory_percent: Optional[float] = None

    uptime_seconds: Optional[int] = None
    threads: Optional[int] = None
    restart_count: Optional[int] = None

    status: str