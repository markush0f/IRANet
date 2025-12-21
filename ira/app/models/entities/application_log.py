from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field


class ApplicationLog(SQLModel, table=True):
    __tablename__ = "application_logs"  # type: ignore

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    application_id: UUID = Field(
        foreign_key="applications.id",
        index=True,
    )

    path: str
    enabled: bool = True
    discovered: bool = True

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
