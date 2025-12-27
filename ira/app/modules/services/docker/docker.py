import docker
from docker.errors import DockerException

from app.extensions.ai_chat.tools.registry import tool
from app.modules.types.DOCKER_CONTAINER import DockerContainer

@tool()
def system_docker_containers() -> list[DockerContainer] | dict:
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)

        system_containers = []

        for container in containers:
            labels = container.attrs.get("Config", {}).get("Labels", {}) or {}

            # Exclude docker-compose containers
            # if "com.docker.compose.project" in labels:
            #     continue

            system_containers.append(
                {
                    "id": container.short_id,
                    "name": container.name,
                    "image": container.image.tags,
                    "status": container.status,
                    "state": container.attrs["State"]["Status"],
                    "created": container.attrs["Created"],
                }
            )

        return system_containers

    except DockerException as exc:
        return {
            "error": "Docker not available",
            "details": str(exc),
        }
