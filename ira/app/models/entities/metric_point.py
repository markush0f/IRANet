from datetime import datetime

from sqlalchemy import Column, DateTime
from sqlmodel import SQLModel, Field


class MetricPoint(SQLModel, table=True):
    __tablename__ = "metrics_points"  # type: ignore

    id: int | None = Field(default=None, primary_key=True)

    ts: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    metric: str
    value: float
    host: str


from enum import Enum


class MetricName(str, Enum):

    # CPU
    CPU_TOTAL = "cpu.total"
    CPU_USER = "cpu.user"
    CPU_SYSTEM = "cpu.system"
    CPU_IDLE = "cpu.idle"

    # Memory
    MEMORY_USED_KB = "memory.used_kb"
    MEMORY_FREE_KB = "memory.free_kb"
    MEMORY_AVAILABLE_PERCENT = "memory.available_percent"

    # Load
    LOAD_1M = "load.1m"
    LOAD_5M = "load.5m"
    LOAD_15M = "load.15m"

    # Network latency
    NET_LATENCY_AVG = "net.latency.avg_ms"
    NET_LATENCY_MIN = "net.latency.min_ms"
    NET_LATENCY_MAX = "net.latency.max_ms"
    NET_JITTER = "net.jitter.ms"
    NET_PACKET_LOSS = "net.packet_loss.percent"
