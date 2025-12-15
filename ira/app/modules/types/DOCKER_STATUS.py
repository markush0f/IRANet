from typing import Literal


DOCKER_STATUS = Literal[
    "created",
    "restarting",
    "running",
    "removing",
    "paused",
    "exited",
    "dead",
]
