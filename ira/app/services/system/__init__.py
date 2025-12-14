"""High-level façade for system services.

This package splits the original :mod:`app.services.system` module into
smaller, responsibility-focused modules while keeping a stable public
API.
"""

from .system_list import list_services
from .system_status import get_service_status
from .system_actions import start_service, stop_service, restart_service

__all__ = [
    "list_services",
    "get_service_status",
    "start_service",
    "stop_service",
    "restart_service",
]

