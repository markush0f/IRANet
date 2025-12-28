from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


class ApplicationMetrics(SQLModel, table=True):
    __tablename__ = "application_metrics"  # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)

    application_id: UUID = Field(
        foreign_key="applications.id",
        index=True,
        nullable=False,
    )

    ts: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            index=True,
        )
    )

    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    memory_percent: Optional[float] = None

    uptime_seconds: Optional[int] = None
    threads: Optional[int] = None
    restart_count: Optional[int] = None

    status: str = Field(nullable=False)
