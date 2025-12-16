from typing import TypedDict


class MetricPoint(TypedDict):
    ts: int
    metric: str
    value: float
    host: str
