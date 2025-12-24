from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, UniqueConstraint
from sqlmodel import SQLModel, Field


class ApplicationLogPath(SQLModel, table=True):
    __tablename__ = "application_log_paths"
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    application_id: UUID = Field(
        foreign_key="applications.id",
        index=True,
        nullable=False,
    )

    base_path: str = Field(nullable=False)

    enabled: bool = Field(default=True)
    discovered: bool = Field(default=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    __table_args__ = (
        UniqueConstraint("application_id", "base_path"),
    )
