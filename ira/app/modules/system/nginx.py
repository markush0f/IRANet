"""
Nginx service inspection and control utilities.

This module provides helpers to query the status of the local Nginx
service and to trigger a reload, using common system tools such as
``systemctl`` or the ``nginx`` binary directly.
"""

from __future__ import annotations

from typing import Any, Dict

from app.core.logger import get_logger
from app.modules.system.commands import run_command


logger = get_logger(__name__)


def get_nginx_status() -> Dict[str, Any]:
    """
    Get the status of the Nginx service.

    It first tries ``systemctl is-active nginx`` and falls back to
    ``nginx -t`` if systemd is not available.

    Returns:
        Dict[str, Any]: A dictionary containing:
            - ``"ok"`` (bool): Whether the status could be determined.
            - ``"active"`` (bool | None): True if active, False if not,
              None if unknown.
            - ``"details"`` (str): Raw status or test output.
            - ``"error"`` (str | None): Error message if any.
    """
    logger.info("Checking Nginx service status")

    # Try systemctl is-active nginx
    systemctl_result = run_command(["systemctl", "is-active", "nginx"])

    if systemctl_result["ok"]:
        state = systemctl_result["stdout"].strip()
        logger.debug("Nginx systemctl state: %s", state)
        return {
            "ok": True,
            "active": state == "active",
            "details": state,
            "error": None,
        }

    # Fallback to nginx -t (configuration test)
    logger.debug("systemctl failed, falling back to 'nginx -t'")

    nginx_test = run_command(["nginx", "-t"])

    if nginx_test["ok"]:
        details = nginx_test["stderr"] or nginx_test["stdout"]
        logger.debug("Nginx config test output: %s", details)
        return {
            "ok": True,
            "active": None,
            "details": details,
            "error": None,
        }

    logger.error("Unable to determine Nginx status: %s", nginx_test["stderr"])

    return {
        "ok": False,
        "active": None,
        "details": nginx_test["stdout"],
        "error": nginx_test["stderr"],
    }


def reload_nginx() -> Dict[str, Any]:
    """
    Reload the Nginx service.

    It tries ``systemctl reload nginx`` and falls back to
    ``nginx -s reload`` if systemd is not available.

    Returns:
        Dict[str, Any]: A dictionary containing:
            - ``"ok"`` (bool): Whether the reload was successful.
            - ``"method"`` (str | None): Which command was used.
            - ``"error"`` (str | None): Error message if any.
    """
    logger.info("Reloading Nginx service")

    # Try systemctl reload nginx
    systemctl_reload = run_command(["systemctl", "reload", "nginx"])

    if systemctl_reload["ok"]:
        logger.info("Nginx reloaded using systemctl")
        return {
            "ok": True,
            "method": "systemctl reload nginx",
            "error": None,
        }

    # Fallback to nginx -s reload
    logger.debug("systemctl reload failed, falling back to 'nginx -s reload'")

    nginx_reload = run_command(["nginx", "-s", "reload"])

    if nginx_reload["ok"]:
        logger.info("Nginx reloaded using nginx -s reload")
        return {
            "ok": True,
            "method": "nginx -s reload",
            "error": None,
        }

    logger.error(
        "Failed to reload Nginx: %s",
        nginx_reload["stderr"] or systemctl_reload["stderr"],
    )

    return {
        "ok": False,
        "method": None,
        "error": nginx_reload["stderr"] or systemctl_reload["stderr"],
    }
