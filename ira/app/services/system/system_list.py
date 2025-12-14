"""
System services listing utilities.

This module provides helpers to list services present on the system and
to control them (start, stop, restart) using ``systemctl`` when
available, or falling back to the classic ``service`` command.
"""

from __future__ import annotations

from typing import Any, Dict, List

from app.core.logger import get_logger
from app.modules.system.commands import run_command


logger = get_logger(__name__)


def list_services() -> Dict[str, Any]:
    """
    List system services.

    It tries ``systemctl list-units --type=service`` and falls back to
    ``service --status-all`` if systemd is not available.

    Returns:
        Dict[str, Any]: A dictionary with:
            - ``"services"``: list of service objects.
            - ``"error"``: error message if any.
    """
    logger.info("Listing system services")

    # Try systemctl listing
    cmd = [
        "systemctl",
        "list-units",
        "--type=service",
        "--all",
        "--no-pager",
        "--no-legend",
    ]
    result = run_command(cmd)

    services: List[Dict[str, Any]] = []

    if result["ok"]:
        for line in result["stdout"].splitlines():
            line = line.strip()
            if not line:
                continue

            # UNIT LOAD ACTIVE SUB DESCRIPTION
            parts = line.split(None, 4)
            if len(parts) < 4:
                continue

            unit = parts[0]
            load = parts[1]
            active = parts[2]
            sub = parts[3]
            description = parts[4] if len(parts) > 4 else ""

            services.append(
                {
                    "unit": unit,
                    "load": load,
                    "active": active,
                    "sub": sub,
                    "description": description,
                }
            )

        logger.info(
            "System services listed via systemctl: %d services", len(services)
        )
        return {"services": services, "error": None}

    logger.debug("systemctl list-units failed, falling back to 'service --status-all'")

    # Fallback: service --status-all
    fallback = run_command(["service", "--status-all"])

    if not fallback["ok"]:
        logger.error(
            "Failed to list services: %s", fallback["stderr"] or result["stderr"]
        )
        return {
            "services": [],
            "error": fallback["stderr"] or result["stderr"],
        }

    for line in fallback["stdout"].splitlines():
        line = line.strip()
        if not line:
            continue

        # Expected format: [ + ]  service_name
        parts = line.split()
        if len(parts) >= 4 and parts[0] == "[" and parts[2] == "]":
            status_symbol = parts[1]
            name = parts[3]
        else:
            # Fallback parsing: last token as name
            status_symbol = "?"
            name = parts[-1]

        if status_symbol == "+":
            status = "running"
        elif status_symbol == "-":
            status = "stopped"
            status = "stopped"
        else:
            status = "unknown"

        services.append(
            {
                "name": name,
                "status": status,
            }
        )

    logger.info(
        "System services listed via service --status-all: %d services",
        len(services),
    )

    return {"services": services, "error": None}

