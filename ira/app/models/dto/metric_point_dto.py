from typing import TypedDict
from datetime import datetime

class MetricPointDTO(TypedDict):
    ts: datetime
    metric: str
    value: float
    host: str
