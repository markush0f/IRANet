
from typing import Dict
from app.modules.common.base import PROC_PATH


def load_average() -> Dict[str, float]:
    """
    Read system load averages.

    Returns the 1, 5 and 15 minute load averages as reported by
    /proc/loadavg.
    """
    try:
        with (PROC_PATH / "loadavg").open() as f:
            one, five, fifteen, *_ = f.readline().split()
            return {
                "load_1m": float(one),
                "load_5m": float(five),
                "load_15m": float(fifteen),
            }
    except Exception:
        return {
            "load_1m": 0.0,
            "load_5m": 0.0,
            "load_15m": 0.0,
        }