from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field


class MetricPoint(SQLModel, table=True):
    __tablename__ = "metrics_points"  # type: ignore

    id: int | None = Field(default=None, primary_key=True)

    ts: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    metric: str
    value: float
    host: str
