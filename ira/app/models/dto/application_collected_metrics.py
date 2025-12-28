
from typing import Optional
from pydantic import BaseModel


class ApplicationCollectedMetricsDTO(BaseModel):
    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    memory_percent: Optional[float] = None

    uptime_seconds: Optional[int] = None
    threads: Optional[int] = None
    restart_count: Optional[int] = None

    status: str
