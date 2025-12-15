import platform
import socket
import uuid

import psutil
import distro


def host_info() -> dict:
    system = platform.system()

    info = {
        "hostname": socket.gethostname(),
        "fqdn": socket.getfqdn(),
        "os": system,
        "kernel": platform.release(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "boot_time": psutil.boot_time(),
        "python_version": platform.python_version(),
        "network": {
            "mac_address": hex(uuid.getnode()),
        },
    }

    if system == "Linux":
        info["distribution"] = {
            "name": distro.name(),
            "version": distro.version(),
            "codename": distro.codename(),
        }

    return info
