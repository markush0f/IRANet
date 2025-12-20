from datetime import datetime
from typing import List

from app.models.dto.metric_point_dto import MetricPointDTO
from app.modules.internet.ping import measure_latency
from app.modules.internet.interfaces import measure_interfaces_traffic


class InternetMetricsService:
    def __init__(self, *, ping_host: str) -> None:
        self._ping_host = ping_host

    async def build_internet_metrics(
        self,
        *,
        ts: datetime,
        host: str,
    ) -> List[MetricPointDTO]:
        rows: List[MetricPointDTO] = []

        latency = await measure_latency(self._ping_host)

        rows.extend([
            {
                "ts": ts,
                "metric": "net.latency.avg_ms",
                "value": latency["latency_avg_ms"],
                "host": host,
            },
            {
                "ts": ts,
                "metric": "net.latency.min_ms",
                "value": latency["latency_min_ms"],
                "host": host,
            },
            {
                "ts": ts,
                "metric": "net.latency.max_ms",
                "value": latency["latency_max_ms"],
                "host": host,
            },
            {
                "ts": ts,
                "metric": "net.jitter.ms",
                "value": latency["jitter_ms"],
                "host": host,
            },
            {
                "ts": ts,
                "metric": "net.packet_loss.percent",
                "value": latency["packet_loss_percent"],
                "host": host,
            },
        ])

        interfaces = measure_interfaces_traffic()

        for interface, data in interfaces.items():
            rows.append({
                "ts": ts,
                "metric": f"net.{interface}.rx.bytes",
                "value": data["rx_bytes"],
                "host": host,
            })
            rows.append({
                "ts": ts,
                "metric": f"net.{interface}.tx.bytes",
                "value": data["tx_bytes"],
                "host": host,
            })

        return rows
