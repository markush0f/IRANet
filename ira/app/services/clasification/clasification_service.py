from typing import Dict, List

from app.models.entities.service import Service
from app.extensions.ai_chat.tools.registry import tool_class
from app.services.clasification.discovery_orchestrator_service import ServiceDiscoveryOrchestrator


# Temporary hardcoded database signatures.
# This will be replaced by database-driven configuration in the future.
DATABASE_SIGNATURES: Dict[str, List[str]] = {
    "postgresql": ["postgres"],
    "mysql": ["mysql", "mariadb"],
    "mongodb": ["mongo"],
    "redis": ["redis"],
    "influxdb": ["influx"],
    "clickhouse": ["clickhouse"],
    "couchdb": ["couchdb"],
}


@tool_class(name_prefix="classification")
class ClasificationService:

    def classify_database_services(self) -> List[Dict]:
        orchestrator = ServiceDiscoveryOrchestrator()
        services: List[Service] = orchestrator.discover_all()

        databases: List[Dict] = []

        for service in services:
            identifier = " ".join(
                filter(
                    None,
                    [
                        service.name,
                        service.process,
                        service.image,
                    ],
                )
            ).lower()

            for engine, keywords in DATABASE_SIGNATURES.items():
                if any(keyword in identifier for keyword in keywords):
                    databases.append(
                        {
                            "engine": engine,
                            "service": service,
                        }
                    )
                    break

        return databases
