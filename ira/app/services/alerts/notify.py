"""
NOTIFY ALERTS SERVICE BY WEBSOCKETS SYSTEM
"""

from typing import Dict
import time
from datetime import datetime, timezone

from app.core.logger import get_logger
from app.core.websocket_manager import ws_manager
from app.infrastructure.alerts.storage import insert_critical_alert


_LAST_ALERT_TS: Dict[str, float] = {}
_COOLDOWN_SECONDS = 30

# Thresholds centralized
CPU_CRITICAL = 80
MEMORY_AVAILABLE_CRITICAL = 80
LOAD_FACTOR_CRITICAL = 80

logger = get_logger(__name__)


async def notify_critical_alert(
    alert: str,
    host: str,
    alert_type: str,
    *,
    value: float,
    threshold: float,
) -> None:
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

    # Timestamp changed to ISO 8601 UTC
    payload = {
        "level": "critical",
        "type": alert_type,
        "host": host,
        "message": alert,
        "value": value,
        "threshold": threshold,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await save_critical_alert(
        alert=alert,
        host=host,
        alert_type=alert_type,
        value=value,
        threshold=threshold,
    )
    await ws_manager.broadcast("alerts", payload)

    logger.info(
        "Broadcasted critical alert %s for %s: %s",
        alert_type,
        host,
        alert,
    )


async def save_critical_alert(
    alert: str,
    host: str,
    alert_type: str,
    *,
    value: float,
    threshold: float,
) -> None:
    """
    Save a critical alert to the database.
    """
    try:
        logger.info("Saving critical alert to database.")
        await insert_critical_alert(
            host=host,
            metric=alert_type,
            level="critical",
            value=value,
            threshold=threshold,
            message=alert,
        )
    except Exception:
        logger.exception("Failed to persist alert %s for %s", alert_type, host)


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

    if cpu_total > CPU_CRITICAL:
        await notify_critical_alert(
            alert=f"CPU usage critical: {cpu_total:.2f}%",
            host=host,
            alert_type="cpu.total",
            value=cpu_total,
            threshold=CPU_CRITICAL,
        )
        logger.warning("CPU usage exceeds threshold: %.2f%%", cpu_total)

    if memory_available_percent < MEMORY_AVAILABLE_CRITICAL:
        await notify_critical_alert(
            alert=f"Low available memory: {memory_available_percent:.2f}%",
            host=host,
            alert_type="memory.available.percent",
            value=memory_available_percent,
            threshold=MEMORY_AVAILABLE_CRITICAL,
        )
        logger.warning(
            "Available memory below threshold: %.2f%%",
            memory_available_percent,
        )

    # Load check softened using CPU core factor
    load_threshold = cpu_cores * LOAD_FACTOR_CRITICAL
    if load_1m > load_threshold:
        await notify_critical_alert(
            alert=f"Load average too high: {load_1m:.2f} (cores: {cpu_cores})",
            host=host,
            alert_type="load.1m",
            value=load_1m,
            threshold=load_threshold,
        )
        logger.warning(
            "Load average %.2f exceeds CPU cores %d",
            load_1m,
            cpu_cores,
        )
