import asyncio
import statistics
from typing import List

from app.modules.internet.types import LatencyMetrics


async def measure_latency(
    host: str = "1.1.1.1",
    count: int = 5,
) -> LatencyMetrics:
    process = await asyncio.create_subprocess_exec(
        "ping",
        "-c",
        str(count),
        host,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, _ = await process.communicate()
    output = stdout.decode()

    latencies: List[float] = []

    for line in output.splitlines():
        if "time=" in line:
            latencies.append(float(line.split("time=")[1].split(" ")[0]))

    received = len(latencies)
    packet_loss = 100.0 * (count - received) / count

    return {
        "latency_avg_ms": statistics.mean(latencies) if latencies else 0.0,
        "latency_min_ms": min(latencies) if latencies else 0.0,
        "latency_max_ms": max(latencies) if latencies else 0.0,
        "jitter_ms": statistics.pstdev(latencies) if received > 1 else 0.0,
        "packet_loss_percent": packet_loss,
    }
