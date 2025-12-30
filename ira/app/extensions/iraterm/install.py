#!/usr/bin/env python3
import subprocess
import shutil
import socket
import os
import time
from pathlib import Path


EXTENSION_NAME = "iraterm"
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
PID_FILE = BASE_DIR / "backend.pid"
COMPOSE_FILE = BASE_DIR / "docker-compose.yml"

BACKEND_PORT = 3001
FRONTEND_PORT = 3000
STARTUP_TIMEOUT = 5  # seconds

BACKEND_PORT_RANGE = (3001, 3010)
PORT_FILE = BASE_DIR / "backend.port"


def _require(cmd: str) -> None:
    if not shutil.which(cmd):
        raise RuntimeError(f"{cmd} is not installed or not in PATH")


def _is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def _check_ports() -> None:
    if _is_port_in_use(BACKEND_PORT):
        raise RuntimeError(f"Port {BACKEND_PORT} is already in use")

    if _is_port_in_use(FRONTEND_PORT):
        raise RuntimeError(f"Port {FRONTEND_PORT} is already in use")


def _is_process_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _check_already_running() -> None:
    if PID_FILE.exists():
        pid = int(PID_FILE.read_text())
        if _is_process_alive(pid):
            raise RuntimeError("Backend is already running")
        PID_FILE.unlink()


def _install_backend() -> None:
    subprocess.run(["npm", "install"], cwd=BACKEND_DIR, check=True)
    subprocess.run(["npm", "run", "build"], cwd=BACKEND_DIR, check=True)


def _start_backend(port: int) -> None:
    process = subprocess.Popen(
        ["npm", "start"],
        cwd=BACKEND_DIR,
        env={**os.environ, "PORT": str(port)},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    PID_FILE.write_text(str(process.pid))
    PORT_FILE.write_text(str(port))

    start = time.time()
    while time.time() - start < STARTUP_TIMEOUT:
        if _is_port_in_use(port):
            return
        time.sleep(0.2)

    raise RuntimeError("Backend failed to start")


def _up_frontend(port: int) -> None:
    env = {**os.environ, "IRATERM_BACKEND_PORT": str(port)}

    subprocess.run(
        ["docker", "compose", "-f", str(COMPOSE_FILE), "up", "-d", "--build"],
        cwd=BASE_DIR,
        env=env,
        check=True,
    )


def _find_free_port(start: int, end: int) -> int:
    for port in range(start, end + 1):
        if not _is_port_in_use(port):
            return port
    raise RuntimeError(f"No free ports available in range {start}-{end}")


def main() -> None:
    print(f"Installing and enabling extension: {EXTENSION_NAME}")

    _require("node")
    _require("npm")
    _require("docker")

    # _check_ports()
    _check_already_running()
    _install_backend()
    backend_port = _find_free_port(3001, 3010)
    _start_backend(backend_port)
    _up_frontend(backend_port)
    print(f"Extension {EXTENSION_NAME} enabled")


if __name__ == "__main__":
    main()
