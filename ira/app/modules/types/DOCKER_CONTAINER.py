from typing import List, TypedDict
from app.modules.types.DOCKER_STATUS import DOCKER_STATUS


class DockerContainer(TypedDict):
    id: str
    name: str
    image: List[str]
    status: str
    state: DOCKER_STATUS
    created: str