"""
NOTIFY ALERTS SERVICE BY WEBSOCKETS SYSTEM
"""

from typing import Dict
import time

from app.core.logger import get_logger
from app.core.websocket_manager import ws_manager


_LAST_ALERT_TS: Dict[str, float] = {}
_COOLDOWN_SECONDS = 30
logger = get_logger(__name__)


async def notify_critical_alert(alert: str, host: str, alert_type: str) -> None:
    """
    Send a critical alert through WebSockets with cooldown protection.
    """
    now = time.time()
    key = f"{host}:{alert_type}"

    last_ts = _LAST_ALERT_TS.get(key, 0)
    if now - last_ts < _COOLDOWN_SECONDS:
        logger.debug(
            "Critical alert for %s deferred because of cooldown (%s seconds remaining)",
            key,
            _COOLDOWN_SECONDS - (now - last_ts),
        )
        return

    _LAST_ALERT_TS[key] = now

    payload = {
        "level": "critical",
        "type": alert_type,
        "host": host,
        "message": alert,
        "timestamp": now,
    }

    await ws_manager.broadcast("alerts", payload)
    logger.info(
        "Broadcasted critical alert %s for %s: %s",
        alert_type,
        host,
        alert,
    )


async def evaluate_alerts(
    *,
    cpu_total: float,
    memory_available_percent: float,
    load_1m: float,
    cpu_cores: int,
    host: str,
) -> None:
    """
    Evaluate system metrics and emit critical alerts if needed.
    """

    logger.debug(
        "Evaluating metrics for %s: cpu_total=%.2f memory_available=%.2f load_1m=%.2f cores=%d",
        host,
        cpu_total,
        memory_available_percent,
        load_1m,
        cpu_cores,
    )

    if cpu_total > 90:
        await notify_critical_alert(
            alert=f"CPU usage critical: {cpu_total:.2f}%",
            host=host,
            alert_type="cpu",
        )
        logger.warning("CPU usage exceeds threshold: %.2f%%", cpu_total)

    if memory_available_percent < 10:
        await notify_critical_alert(
            alert=f"Low available memory: {memory_available_percent:.2f}%",
            host=host,
            alert_type="memory",
        )
        logger.warning("Available memory below threshold: %.2f%%", memory_available_percent)

    if load_1m > cpu_cores:
        await notify_critical_alert(
            alert=f"Load average too high: {load_1m:.2f} (cores: {cpu_cores})",
            host=host,
            alert_type="load",
        )
        logger.warning("Load average %.2f exceeds CPU cores %d", load_1m, cpu_cores)
