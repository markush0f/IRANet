"""
System service control utilities (start/stop/restart).
"""

from __future__ import annotations

from typing import Any, Dict

from app.core.logger import get_logger
from app.modules.system.commands import run_command


logger = get_logger(__name__)


def _service_action(service_name: str, action: str) -> Dict[str, Any]:
    """
    Execute an action (start/stop/restart) on a service.
    """
    logger.info("Executing service action '%s' for service '%s'", action, service_name)

    systemctl_cmd = ["systemctl", action, service_name]
    result = run_command(systemctl_cmd)

    if result["ok"]:
        logger.info("Service %s %sed via systemctl", service_name, action)
        return {
            "ok": True,
            "service": service_name,
            "method": " ".join(systemctl_cmd),
            "error": None,
        }

    logger.debug(
        "systemctl %s failed for %s, falling back to 'service %s'",
        action,
        service_name,
        action,
    )

    fallback_cmd = ["service", service_name, action]
    fallback = run_command(fallback_cmd)

    if fallback["ok"]:
        logger.info("Service %s %sed via service command", service_name, action)
        return {
            "ok": True,
            "service": service_name,
            "method": " ".join(fallback_cmd),
            "error": None,
        }

    logger.error(
        "Failed to %s service %s: %s",
        action,
        service_name,
        fallback["stderr"] or result["stderr"],
    )

    return {
        "ok": False,
        "service": service_name,
        "method": None,
        "error": fallback["stderr"] or result["stderr"],
    }


def start_service(service_name: str) -> Dict[str, Any]:
    """Start a system service."""
    return _service_action(service_name, "start")


def stop_service(service_name: str) -> Dict[str, Any]:
    """Stop a system service."""
    return _service_action(service_name, "stop")


def restart_service(service_name: str) -> Dict[str, Any]:
    """Restart a system service."""
    return _service_action(service_name, "restart")

