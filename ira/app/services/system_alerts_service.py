import time
from datetime import datetime, timezone
from typing import Dict

from app.core.logger import get_logger
from app.core.websocket_manager import ws_manager
from app.repositories.system_alerts import SystemAlertRepository


logger = get_logger(__name__)


class SystemAlertsService:
    CPU_CRITICAL = 80
    MEMORY_AVAILABLE_CRITICAL = 80
    LOAD_FACTOR_CRITICAL = 80

    _COOLDOWN_SECONDS = 30

    def __init__(
        self,
        session
    ) -> None:
        self._alerts_repository = SystemAlertRepository(session),
        self._last_alert_ts: Dict[str, float] = {}

    async def notify_critical_alert(
        self,
        *,
        alert: str,
        host: str,
        alert_type: str,
        value: float,
        threshold: float,
    ) -> None:
        now = time.time()
        key = f"{host}:{alert_type}"

        last_ts = self._last_alert_ts.get(key, 0)
        if now - last_ts < self._COOLDOWN_SECONDS:
            logger.debug(
                "Critical alert for %s deferred because of cooldown (%s seconds remaining)",
                key,
                self._COOLDOWN_SECONDS - (now - last_ts),
            )
            return

        self._last_alert_ts[key] = now

        payload = {
            "level": "critical",
            "type": alert_type,
            "host": host,
            "message": alert,
            "value": value,
            "threshold": threshold,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        await self._save_critical_alert(
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

    async def _save_critical_alert(
        self,
        *,
        alert: str,
        host: str,
        alert_type: str,
        value: float,
        threshold: float,
    ) -> None:
        try:
            await self._alerts_repository.insert_critical(
                host=host,
                metric=alert_type,
                level="critical",
                value=value,
                threshold=threshold,
                message=alert,
            )
        except Exception:
            logger.exception(
                "Failed to persist alert %s for %s",
                alert_type,
                host,
            )

    async def evaluate_alerts(
        self,
        *,
        cpu_total: float,
        memory_available_percent: float,
        load_1m: float,
        cpu_cores: int,
        host: str,
    ) -> None:
        logger.debug(
            "Evaluating metrics for %s: cpu_total=%.2f memory_available=%.2f load_1m=%.2f cores=%d",
            host,
            cpu_total,
            memory_available_percent,
            load_1m,
            cpu_cores,
        )

        if cpu_total > self.CPU_CRITICAL:
            await self.notify_critical_alert(
                alert=f"CPU usage critical: {cpu_total:.2f}%",
                host=host,
                alert_type="cpu.total",
                value=cpu_total,
                threshold=self.CPU_CRITICAL,
            )

        if memory_available_percent < self.MEMORY_AVAILABLE_CRITICAL:
            await self.notify_critical_alert(
                alert=f"Low available memory: {memory_available_percent:.2f}%",
                host=host,
                alert_type="memory.available.percent",
                value=memory_available_percent,
                threshold=self.MEMORY_AVAILABLE_CRITICAL,
            )

        load_threshold = cpu_cores * self.LOAD_FACTOR_CRITICAL
        if load_1m > load_threshold:
            await self.notify_critical_alert(
                alert=f"Load average too high: {load_1m:.2f} (cores: {cpu_cores})",
                host=host,
                alert_type="load.1m",
                value=load_1m,
                threshold=load_threshold,
            )
