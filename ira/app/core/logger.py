"""
Centralised logging utilities for the IRA application.

All modules should obtain loggers from this module so that logging
configuration is consistent across the codebase.
"""

from __future__ import annotations

import logging
import os
import re
from logging.handlers import TimedRotatingFileHandler
from typing import Optional

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"
DEFAULT_LOG_DIR = "logs"
DEFAULT_LOG_FILE = "ira.log"
LOG_DATE_SUFFIX = "%Y-%m-%d"
LOG_RETENTION_DAYS = int(os.getenv("IRA_LOG_RETENTION_DAYS", "14"))


def _ensure_log_directory(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Return a configured logger instance.

    On first call, it initialises console+file logging so the entire
    application consistently writes into ``logs/ira.log`` (or an override)
    and rotates the file every midnight so each date has its own archive.
    """
    root_logger = logging.getLogger()

    if not root_logger.handlers:
        log_dir = os.getenv("IRA_LOG_DIR", DEFAULT_LOG_DIR)
        _ensure_log_directory(log_dir)
        log_path = os.path.join(log_dir, DEFAULT_LOG_FILE)

        formatter = logging.Formatter(LOG_FORMAT)

        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(formatter)
        root_logger.addHandler(stream_handler)

        file_handler = TimedRotatingFileHandler(
            log_path,
            when="midnight",
            interval=1,
            backupCount=LOG_RETENTION_DAYS,
            encoding="utf-8",
        )
        file_handler.suffix = LOG_DATE_SUFFIX
        file_handler.extMatch = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

        root_logger.setLevel(logging.INFO)

    return logging.getLogger(name or "ira")
