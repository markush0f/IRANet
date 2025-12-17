from typing import Any, Dict

from app.infrastructure.alerts.queries import fetch_alerts_paginated


async def get_alerts(page: int = 1, page_size: int = 50) -> Dict[str, Any]:
    """
    Return paginated alert records arranged by ``last_seen_at``.
    """

    normalized_page = max(page, 1)
    normalized_page_size = max(page_size, 1)
    offset = (normalized_page - 1) * normalized_page_size

    alerts, total = await fetch_alerts_paginated(
        limit=normalized_page_size,
        offset=offset,
    )

    return {
        "page": normalized_page,
        "page_size": normalized_page_size,
        "total": total,
        "alerts": alerts,
    }
