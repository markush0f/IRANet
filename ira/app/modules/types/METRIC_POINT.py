from typing import TypedDict
from datetime import datetime


class MetricPoint(TypedDict):
    ts: datetime
    metric: str
    value: float
    host: str
