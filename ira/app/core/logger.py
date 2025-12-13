"""
Centralised logging utilities for the IRA application.

All modules should obtain loggers from this module so that logging
configuration is consistent across the codebase.
"""

from __future__ import annotations

import logging
from typing import Optional


LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Return a configured logger instance.

    On first call, it initialises basic logging configuration using a
    simple, human-friendly format. Subsequent calls reuse the same
    configuration.
    """
    root_logger = logging.getLogger()

    if not root_logger.handlers:
        logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)

    return logging.getLogger(name or "ira")

