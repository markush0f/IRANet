"""Periodic task that orchestrates metric collection."""

from __future__ import annotations

import asyncio
import socket

from app.core.logger import get_logger
from app.infrastructure.metrics.collector import collect_metrics

COLLECT_INTERVAL_SECONDS = 5

logger = get_logger(__name__)


async def metrics_scheduler() -> None:
    """
    Continuously gather metrics until the service shuts down.

    The scheduler records the hostname once and repeatedly delegates to
    :func:`collect_metrics`, waiting for ``COLLECT_INTERVAL_SECONDS`` between
    attempts. Exceptions are logged but do not halt the loop.
    """

    host = socket.gethostname()
    logger.info("starting metrics scheduler for host %s", host)

    while True:
        try:
            logger.debug("collecting metrics batch for host %s", host)
            await collect_metrics(host)
        except Exception:
            logger.exception("metric collection failed for host %s", host)
        await asyncio.sleep(COLLECT_INTERVAL_SECONDS)
