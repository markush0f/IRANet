from typing import Dict, List

from app.models.entities.service import Service

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


class ServicesClasificationService:

    def classify_database_services(self, services: List[Service]) -> List[dict]:
        databases = []

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
