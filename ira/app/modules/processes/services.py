"""
High-level services for process inspection.

This module acts as a service layer that aggregates the logic provided
by ``app.modules.processes.top`` (CPU and memory based metrics) and
exposes simple functions that can be used from API routes or other
parts of the application.
"""

from typing import Any, Dict, List

from app.core.logger import get_logger
from app.modules.processes.top import (
    get_top_processes,
    get_top_cpu_processes,
    get_top_memory_processes,
    get_processes_summary,
)


logger = get_logger(__name__)


def list_top_cpu_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Service: list top CPU-consuming processes.

    Internally delegates to ``get_top_processes`` which returns CPU usage
    plus memory usage for each process.
    """
    logger.info("Listing top CPU processes (limit=%d)", limit)
    return get_top_processes(limit)


def list_top_cpu_only(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Service: list top processes by CPU perspective only.
    """
    logger.info("Listing top CPU-only processes (limit=%d)", limit)
    return get_top_cpu_processes(limit)


def list_top_memory_processes(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Service: list top processes by memory usage.
    """
    logger.info("Listing top memory processes (limit=%d)", limit)
    return get_top_memory_processes(limit)


def get_processes_overview(limit: int = 5) -> Dict[str, Any]:
    """
    Service: aggregate CPU and memory oriented views.

    Returns a dictionary that combines all relevant information so that
    callers get everything in a single call.
    """
    logger.info("Getting processes overview (limit=%d)", limit)
    summary = get_processes_summary(limit)
    return {
        "limit": limit,
        "top_cpu": summary.get("top_cpu", []),
        "top_memory": summary.get("top_memory", []),
    }

