# app/services/collectors/application_collector.py

from typing import Optional

from pydantic import BaseModel


from app.models.dto.application_collected_metrics import ApplicationCollectedMetricsDTO
from app.models.entities.application import Application
from app.services.collector.collect_process_metrics import collect_process_metrics
from app.services.collector.docker_collector import collect_docker_metrics
from app.services.collector.systemd_collector import collect_systemd_metrics




async def collect_application_metrics(
    *,
    application: Application,
) -> Optional[ApplicationCollectedMetricsDTO]:
    kind = application.kind.lower()

    if kind == "systemd":
        return await collect_systemd_metrics(application)

    if kind == "docker":
        return await collect_docker_metrics(application)

    if kind == "process":
        return await collect_process_metrics(application)

    return None
