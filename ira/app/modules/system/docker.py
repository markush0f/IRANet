"""
Docker containers inspection utilities.

This module provides helpers to query Docker for information about
containers running on the local host. It uses the ``docker`` CLI to
avoid introducing additional dependencies.
"""

from __future__ import annotations

import json
import subprocess
from typing import Any, Dict, List

from app.core.logger import get_logger


logger = get_logger(__name__)


DOCKER_PS_COMMAND = [
    "docker",
    "ps",
    "-a",
    "--format",
    "{{json .}}",
]


def get_docker_containers() -> Dict[str, Any]:
    """
    List all Docker containers on the host.

    The function executes ``docker ps -a`` with a JSON format for each
    container line, parses the output and returns a list of containers.

    Returns:
        Dict[str, Any]: A dictionary with the key ``"containers"`` that
        contains a list of container objects and, optionally, an
        ``"error"`` key if the command could not be executed.
    """
    logger.info("Listing Docker containers using docker CLI")

    try:
        result = subprocess.run(
            DOCKER_PS_COMMAND,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        logger.error("docker command not found on this host")
        return {
            "containers": [],
            "error": "docker command not found on this host",
        }
    except subprocess.CalledProcessError as exc:
        error_message = exc.stderr.strip() or "failed to list docker containers"
        logger.error("Error listing docker containers: %s", error_message)
        return {
            "containers": [],
            "error": error_message,
        }

    containers: List[Dict[str, Any]] = []

    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue

        try:
            containers.append(json.loads(line))
        except json.JSONDecodeError:
            # Skip lines that cannot be parsed as JSON
            logger.debug("Skipping non-JSON docker ps line: %s", line)
            continue

    logger.info("Docker containers listed: %d containers", len(containers))

    return {"containers": containers}


def stop_docker_container(container_id: str) -> Dict[str, Any]:
    """
    Stop a Docker container by ID or name.

    Args:
        container_id: The container ID or name to stop.

    Returns:
        Dict[str, Any]: A dictionary with keys:
            - ``"ok"`` (bool): Whether the operation succeeded.
            - ``"container"`` (str): The ID or name of the container.
            - ``"error"`` (str, optional): Error message when the command fails.
    """
    cmd = ["docker", "stop", container_id]

    logger.info("Stopping Docker container: %s", container_id)

    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        logger.error("docker command not found on this host")
        return {
            "ok": False,
            "container": container_id,
            "error": "docker command not found on this host",
        }
    except subprocess.CalledProcessError as exc:
        error_message = exc.stderr.strip() or "failed to stop docker container"
        logger.error(
            "Error stopping docker container '%s': %s", container_id, error_message
        )
        return {
            "ok": False,
            "container": container_id,
            "error": error_message,
        }

    # docker stop usually prints the container ID or name on success
    output = result.stdout.strip() or container_id

    logger.info("Docker container stopped successfully: %s", output)

    return {
        "ok": True,
        "container": output,
    }
