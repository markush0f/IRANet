
import psutil
from datetime import datetime

from app.models.dto.application_collected_metrics import ApplicationCollectedMetricsDTO
from app.models.entities.application import Application



async def collect_process_metrics(
    application: Application,
) -> ApplicationCollectedMetricsDTO | None:
    if not application.pid:
        return None

    try:
        proc = psutil.Process(application.pid)

        cpu_percent = proc.cpu_percent(interval=None)
        mem_info = proc.memory_info()

        uptime_seconds = int(
            datetime.utcnow().timestamp() - proc.create_time()
        )

        return ApplicationCollectedMetricsDTO(
            cpu_percent=cpu_percent,
            memory_mb=mem_info.rss / 1024 / 1024,
            memory_percent=proc.memory_percent(),
            uptime_seconds=uptime_seconds,
            threads=proc.num_threads(),
            restart_count=None,
            status="running",
        )

    except psutil.NoSuchProcess:
        return ApplicationCollectedMetricsDTO(
            status="stopped",
        )
