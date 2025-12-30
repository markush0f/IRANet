#!/usr/bin/env python3
import subprocess
import os
import signal
from pathlib import Path


EXTENSION_NAME = "iraterm"
BASE_DIR = Path(__file__).resolve().parent
PID_FILE = BASE_DIR / "backend.pid"
COMPOSE_FILE = BASE_DIR / "docker-compose.yml"


def _stop_backend() -> None:
    if PID_FILE.exists():
        pid = int(PID_FILE.read_text())
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        PID_FILE.unlink()


def _down_frontend() -> None:
    subprocess.run(
        ["docker", "compose", "-f", str(COMPOSE_FILE), "down"],
        cwd=BASE_DIR,
        check=True,
    )


def main() -> None:
    print(f"Disabling and uninstalling extension: {EXTENSION_NAME}")

    _down_frontend()
    _stop_backend()

    print(f"Extension {EXTENSION_NAME} disabled")


if __name__ == "__main__":
    main()
