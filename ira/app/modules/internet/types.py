from typing import Dict, TypedDict


class InterfaceTraffic(TypedDict):
    rx_bytes: int
    tx_bytes: int


InterfacesTraffic = Dict[str, InterfaceTraffic]

class LatencyMetrics(TypedDict):
    latency_avg_ms: float
    latency_min_ms: float
    latency_max_ms: float
    jitter_ms: float
    packet_loss_percent: float
