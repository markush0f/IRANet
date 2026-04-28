from datetime import datetime
from typing import List, Dict

from app.repositories.metric_point import MetricPointRepository
from app.extensions.ai_chat.tools.registry import tool_class


@tool_class(name_prefix="internet_events")
class InternetEventsService:
    def __init__(self, repository: MetricPointRepository) -> None:
        self._repository = repository

    async def get_packet_loss_events(
        self,
        *,
        server_id: str,
        ts_from: datetime,
        ts_to: datetime,
    ) -> List[Dict]:
        """
        Return packet loss events for a server within a given time range.

        This method delegates the detection and aggregation of packet loss
        events to the metrics repository. It acts as a domain-level entry
        point for Internet-related events, without exposing SQL or storage
        details to upper layers.

        Parameters:
            server_id (str): Server identifier.
            ts_from (datetime): Start of the time range (inclusive).
            ts_to (datetime): End of the time range (inclusive).

        Returns:
            List[Dict]: A list of packet loss events with aggregated data.
        """
        return await self._repository.list_packet_loss_events(
            server_id=server_id,
            ts_from=ts_from,
            ts_to=ts_to,
        )
