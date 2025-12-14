"""
System service status utilities.
"""

from __future__ import annotations

from typing import Any, Dict

from app.core.logger import get_logger
from app.modules.system.commands import run_command


logger = get_logger(__name__)


def get_service_status(service_name: str) -> Dict[str, Any]:
    """
    Get the status of a system service.

    It uses ``systemctl is-active`` and, on failure, falls back to
    ``service <name> status``.
    """
    logger.info("Checking status for service: %s", service_name)

    result = run_command(["systemctl", "is-active", service_name])

    if result["ok"]:
        state = result["stdout"].strip()
        logger.debug("Service %s systemctl state: %s", service_name, state)
        return {
            "ok": True,
            "service": service_name,
            "active": state == "active",
            "raw": state,
            "error": None,
        }

    logger.debug(
        "systemctl is-active failed for %s, falling back to 'service status'",
        service_name,
    )

    fallback = run_command(["service", service_name, "status"])

    if fallback["ok"]:
        logger.debug(
            "Service %s status output: %s",
            service_name,
            fallback["stdout"],
        )
        return {
            "ok": True,
            "service": service_name,
            "active": None,
            "raw": fallback["stdout"],
            "error": None,
        }

    logger.error(
        "Unable to determine status for service %s: %s",
        service_name,
        fallback["stderr"] or result["stderr"],
    )

    return {
        "ok": False,
        "service": service_name,
        "active": None,
        "raw": fallback["stdout"],
        "error": fallback["stderr"] or result["stderr"],
    }

