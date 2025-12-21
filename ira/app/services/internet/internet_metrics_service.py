from datetime import datetime
from typing import Dict, List, Optional, Sequence

from app.models.dto.metric_point_dto import MetricPointDTO
from app.models.entities.metric_point import MetricName, MetricPoint
from app.modules.internet.ping import measure_latency
from app.modules.internet.interfaces import measure_interfaces_traffic
from app.repositories.metric_point import MetricPointRepository


class InternetMetricsService:
    def __init__(self, *, ping_host: str, session) -> None:
        self._ping_host = ping_host
        self.metrics_point_repository = MetricPointRepository(session)

    async def build_internet_metrics(
        self,
        *,
        ts: datetime,
        host: str,
    ) -> List[MetricPointDTO]:
        rows: List[MetricPointDTO] = []

        latency = await measure_latency(self._ping_host)

        rows.extend(
            [
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
            ]
        )

        interfaces = measure_interfaces_traffic()

        for interface, data in interfaces.items():
            rows.append(
                {
                    "ts": ts,
                    "metric": f"net.{interface}.rx.bytes",
                    "value": data["rx_bytes"],
                    "host": host,
                }
            )
            rows.append(
                {
                    "ts": ts,
                    "metric": f"net.{interface}.tx.bytes",
                    "value": data["tx_bytes"],
                    "host": host,
                }
            )

        return rows

    async def get_summary(
        self,
        *,
        host: str,
        interface: str,
    ) -> Dict:
        """
        Return the current Internet status summary for a host.

        This summary represents the latest available state of the network,
        not historical data. It retrieves the most recent metric point for
        latency, jitter and packet loss, and derives current RX/TX throughput
        (Mbps) from the last two counter points of the selected interface.

        Parameters:
            host (str): Host identifier.
            interface (str): Network interface name (e.g. eth0).

        Returns:
            Dict: Internet summary payload containing latency, jitter,
                  packet loss, traffic rates and timestamp.
        """
        latency = await self.metrics_point_repository.get_last_metric(
            host=host,
            metric=MetricName.NET_LATENCY_AVG.value,
        )
        jitter = await self.metrics_point_repository.get_last_metric(
            host=host,
            metric=MetricName.NET_JITTER.value,
        )
        packet_loss = await self.metrics_point_repository.get_last_metric(
            host=host,
            metric=MetricName.NET_PACKET_LOSS.value,
        )

        rx_points = await self.metrics_point_repository.get_limit_metrics(
            host=host, metric=f"net.{interface}.rx.bytes", limit=2
        )
        tx_points = await self.metrics_point_repository.get_limit_metrics(
            host=host, metric=f"net.{interface}.tx.bytes", limit=2
        )

        rx_mbps = self._calculate_mbps(rx_points)
        tx_mbps = self._calculate_mbps(tx_points)

        ts = latency.ts if latency else None

        return {
            "latency_ms": latency.value if latency else None,
            "jitter_ms": jitter.value if jitter else None,
            "packet_loss_percent": packet_loss.value if packet_loss else None,
            "traffic": {
                "interface": interface,
                "rx_mbps": rx_mbps,
                "tx_mbps": tx_mbps,
            },
            "ts": ts,
        }


    def _calculate_mbps(
        self,
        points: Sequence[MetricPoint],
    ) -> Optional[float]:
        if len(points) < 2:
            return None

        current, previous = points[0], points[1]

        delta_bytes = current.value - previous.value
        delta_seconds = (current.ts - previous.ts).total_seconds()

        if delta_seconds <= 0:
            return None

        return (delta_bytes * 8) / delta_seconds / 1_000_000
