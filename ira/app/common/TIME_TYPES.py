from enum import Enum


class TimeType(str, Enum):
    """
    Supported representations for process CPU time.

    These values are aligned with the helpers in
    ``app.modules.processes.top.time``.
    """

    TICKS = "ticks"
    SECONDS = "seconds"
    MILLISECONDS = "milliseconds"
    MINUTES = "minutes"
    HOURS = "hours"
    FORMATTED = "formatted"


__all__ = ["TimeType"]
