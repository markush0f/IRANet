import os
from typing import Dict, List

from app.modules.scanner.models import ListeningPort


TCP_LISTEN_STATE = "0A"


def _read_tcp_table(path: str) -> Dict[int, int]:
    """
    Read /proc/net/tcp or tcp6 and return inode -> port mapping
    for sockets in LISTEN state.
    """
    inode_to_port: Dict[int, int] = {}

    try:
        with open(path, "r") as f:
            next(f)  # skip header
            for line in f:
                parts = line.split()
                local_address = parts[1]
                state = parts[3]
                inode = int(parts[9])

                if state != TCP_LISTEN_STATE:
                    continue

                _, port_hex = local_address.split(":")
                port = int(port_hex, 16)

                inode_to_port[inode] = port
    except Exception:
        pass

    return inode_to_port


def _build_pid_inode_map() -> Dict[int, List[int]]:
    """
    Build pid -> list of socket inodes map.
    """
    pid_to_inodes: Dict[int, List[int]] = {}

    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue

        fd_dir = f"/proc/{pid}/fd"

        try:
            for fd in os.listdir(fd_dir):
                path = os.readlink(f"{fd_dir}/{fd}")
                if path.startswith("socket:["):
                    inode = int(path[8:-1])
                    pid_to_inodes.setdefault(int(pid), []).append(inode)
        except Exception:
            continue

    return pid_to_inodes


def scan_listening_ports() -> List[ListeningPort]:
    """
    Scan system for listening TCP ports and associate them with PIDs.
    """
    tcp_inodes = _read_tcp_table("/proc/net/tcp")
    tcp6_inodes = _read_tcp_table("/proc/net/tcp6")

    pid_inodes = _build_pid_inode_map()

    results: List[ListeningPort] = []

    for pid, inodes in pid_inodes.items():
        for inode in inodes:
            if inode in tcp_inodes:
                results.append(
                    ListeningPort(
                        pid=pid,
                        port=tcp_inodes[inode],
                        protocol="tcp",
                    )
                )
            elif inode in tcp6_inodes:
                results.append(
                    ListeningPort(
                        pid=pid,
                        port=tcp6_inodes[inode],
                        protocol="tcp6",
                    )
                )

    return results
