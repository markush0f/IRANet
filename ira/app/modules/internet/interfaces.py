import psutil
from app.modules.internet.types import InterfacesTraffic


def measure_interfaces_traffic() -> InterfacesTraffic:
    counters = psutil.net_io_counters(pernic=True)

    return {
        interface: {
            "rx_bytes": stats.bytes_recv,
            "tx_bytes": stats.bytes_sent,
        }
        for interface, stats in counters.items()
    }
