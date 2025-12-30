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
FRONTEND_DIR = BASE_DIR / "frontend"

BACKEND_PID_FILE = BASE_DIR / "backend.pid"
FRONTEND_PID_FILE = BASE_DIR / "frontend.pid"

BACKEND_PORT_FILE = BASE_DIR / "backend.port"
FRONTEND_PORT_FILE = BASE_DIR / "frontend.port"

BACKEND_PORT_RANGE = (3001, 3010)
FRONTEND_PORT_RANGE = (3100, 3110)

STARTUP_TIMEOUT = 5

INSTALL_NODE_SCRIPT = BASE_DIR / "install_node.sh"


def _require(cmd: str) -> None:
    if not shutil.which(cmd):
        raise RuntimeError(f"{cmd} is not installed or not in PATH")


def _is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def _find_free_port(start: int, end: int) -> int:
    for port in range(start, end + 1):
        if not _is_port_in_use(port):
            return port
    raise RuntimeError(f"No free ports available in range {start}-{end}")


def _is_process_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _check_process_not_running(pid_file: Path, name: str) -> None:
    if not pid_file.exists():
        return

    pid = int(pid_file.read_text())
    if _is_process_alive(pid):
        raise RuntimeError(f"{name} is already running")

    pid_file.unlink()


def _ensure_node_installed() -> None:
    subprocess.run(
        ["bash", str(INSTALL_NODE_SCRIPT)],
        check=True,
    )


def _install_backend() -> None:
    subprocess.run(["npm", "install"], cwd=BACKEND_DIR, check=True)
    subprocess.run(["npm", "run", "build"], cwd=BACKEND_DIR, check=True)


def _install_frontend() -> None:
    subprocess.run(["npm", "install"], cwd=FRONTEND_DIR, check=True)
    subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, check=True)


def _start_backend(port: int) -> None:
    process = subprocess.Popen(
        ["npm", "start"],
        cwd=BACKEND_DIR,
        env={**os.environ, "PORT": str(port)},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    BACKEND_PID_FILE.write_text(str(process.pid))
    BACKEND_PORT_FILE.write_text(str(port))

    start = time.time()
    while time.time() - start < STARTUP_TIMEOUT:
        if _is_port_in_use(port):
            return
        time.sleep(0.2)

    raise RuntimeError("Backend failed to start")


def _start_frontend(port: int, backend_port: int) -> None:
    process = subprocess.Popen(
        ["npm", "start"],
        cwd=FRONTEND_DIR,
        env={
            **os.environ,
            "PORT": str(port),
            "VITE_IRATERM_BACKEND_PORT": str(backend_port),
        },
    )

    time.sleep(0.5)

    if process.poll() is not None:
        raise RuntimeError("Frontend failed to start")

    FRONTEND_PID_FILE.write_text(str(process.pid))
    FRONTEND_PORT_FILE.write_text(str(port))


def main() -> None:
    print(f"Installing and enabling extension: {EXTENSION_NAME}")

    _ensure_node_installed()
    _require("node")
    _require("npm")

    _check_process_not_running(BACKEND_PID_FILE, "Backend")
    _check_process_not_running(FRONTEND_PID_FILE, "Frontend")

    _install_backend()
    _install_frontend()

    backend_port = _find_free_port(*BACKEND_PORT_RANGE)
    frontend_port = _find_free_port(*FRONTEND_PORT_RANGE)

    _start_backend(backend_port)
    _start_frontend(frontend_port, backend_port)

    print(
        f"Extension {EXTENSION_NAME} enabled "
        f"(backend:{backend_port}, frontend:{frontend_port})"
    )


if __name__ == "__main__":
    main()
