from datetime import datetime

from sqlmodel import SQLModel, Field


class MetricPoint(SQLModel, table=True):
    __tablename__ = "metrics_points"  # type: ignore

    id: int | None = Field(default=None, primary_key=True)

    ts: datetime
    metric: str
    value: float
    host: str
