import os
from app.modules.common.base import PROC_PATH


def iter_pids() -> list[str]:
    """Return a list of all numeric PIDs."""
    return [pid for pid in os.listdir(PROC_PATH) if pid.isdigit()]
