#!/usr/bin/env python3
from __future__ import annotations

import os
import subprocess
from pathlib import Path


def _require_root() -> None:
    if os.geteuid() != 0:
        raise SystemExit("This script must be run as root (use sudo).")


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=False)


def main() -> None:
    _require_root()

    print("Stopping services...")
    _run(["systemctl", "disable", "--now", "iranet-iraterm-frontend.service"])
    _run(["systemctl", "disable", "--now", "iranet-iraterm-backend.service"])
    _run(["systemctl", "daemon-reload"])

    unit_backend = Path("/etc/systemd/system/iranet-iraterm-backend.service")
    unit_frontend = Path("/etc/systemd/system/iranet-iraterm-frontend.service")
    for unit in (unit_backend, unit_frontend):
        if unit.exists():
            unit.unlink()

    _run(["systemctl", "daemon-reload"])
    print("Done.")


if __name__ == "__main__":
    main()

