
import time

from app.modules.common.base import PROC_PATH


def _read_cpu_stat() -> dict[str, int]:
    """
    Read raw CPU counters from /proc/stat (aggregate 'cpu' line).
    """
    with (PROC_PATH / "stat").open() as f:
        parts = f.readline().split()

    return {
        "user": int(parts[1]),
        "nice": int(parts[2]),
        "system": int(parts[3]),
        "idle": int(parts[4]),
        "iowait": int(parts[5]),
        "irq": int(parts[6]),
        "softirq": int(parts[7]),
        "steal": int(parts[8]) if len(parts) > 8 else 0,
    }


def get_cpu_global_top_percent(interval: float = 0.1) -> dict[str, float]:
    """
    %Cpu(s):  1.2 us, 0.3 sy, 0.0 ni, 98.1 id, 0.0 wa, 0.0 hi, 0.4 si, 0.0 st
    Return global CPU usage percentages (top-like).

    """
    snap1 = _read_cpu_stat()
    time.sleep(interval)
    snap2 = _read_cpu_stat()

    deltas = {k: snap2[k] - snap1[k] for k in snap1}
    total = sum(deltas.values())

    if total <= 0:
        return {
            "us": 0.0,
            "sy": 0.0,
            "ni": 0.0,
            "id": 0.0,
            "wa": 0.0,
            "hi": 0.0,
            "si": 0.0,
            "st": 0.0,
        }

    return {
        "us": round((deltas["user"] / total) * 100, 2),
        "ni": round((deltas["nice"] / total) * 100, 2),
        "sy": round((deltas["system"] / total) * 100, 2),
        "id": round((deltas["idle"] / total) * 100, 2),
        "wa": round((deltas["iowait"] / total) * 100, 2),
        "hi": round((deltas["irq"] / total) * 100, 2),
        "si": round((deltas["softirq"] / total) * 100, 2),
        "st": round((deltas["steal"] / total) * 100, 2),
    }
