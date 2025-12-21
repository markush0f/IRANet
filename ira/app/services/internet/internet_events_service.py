from datetime import datetime
from typing import List, Dict

from app.repositories.metric_point import MetricPointRepository


class InternetEventsService:
    def __init__(self, repository: MetricPointRepository) -> None:
        self._repository = repository

    async def get_packet_loss_events(
        self,
        *,
        host: str,
        ts_from: datetime,
        ts_to: datetime,
    ) -> List[Dict]:
        """
        Return packet loss events for a host within a given time range.

        This method delegates the detection and aggregation of packet loss
        events to the metrics repository. It acts as a domain-level entry
        point for Internet-related events, without exposing SQL or storage
        details to upper layers.

        Parameters:
            host (str): Host identifier.
            ts_from (datetime): Start of the time range (inclusive).
            ts_to (datetime): End of the time range (inclusive).

        Returns:
            List[Dict]: A list of packet loss events with aggregated data.
        """
        return await self._repository.list_packet_loss_events(
            host=host,
            ts_from=ts_from,
            ts_to=ts_to,
        )
