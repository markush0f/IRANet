#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path


def _require_root() -> None:
    if os.geteuid() != 0:
        raise SystemExit("This script must be run as root (use sudo).")


def _repo_root() -> Path:
    # .../app/extensions/iraterm/host/install_services.py -> repo root is 4 parents up
    return Path(__file__).resolve().parents[4]


def _run(cmd: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None) -> None:
    subprocess.run(cmd, cwd=cwd, env=env, check=True)


def _write_unit(path: Path, *, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _backend_unit(*, backend_dir: Path, backend_port: int, shell: str) -> str:
    return f"""[Unit]
Description=IRANet IRATerm backend (host)
After=network.target

[Service]
Type=simple
WorkingDirectory={backend_dir}
Environment=PORT={backend_port}
Environment=SHELL={shell}
ExecStart=/usr/bin/node {backend_dir}/dist/server.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
"""


def _frontend_unit(*, frontend_dir: Path, frontend_port: int) -> str:
    # NOTE: `vite preview` is meant for preview; use a proper web server for production if needed.
    return f"""[Unit]
Description=IRANet IRATerm frontend (host)
After=network.target

[Service]
Type=simple
WorkingDirectory={frontend_dir}
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port {frontend_port}
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend-port", type=int, default=3001)
    parser.add_argument("--frontend-port", type=int, default=3010)
    parser.add_argument("--shell", default="/bin/bash")
    args = parser.parse_args()

    _require_root()

    repo_root = _repo_root()
    iraterm_dir = repo_root / "app" / "extensions" / "iraterm"
    backend_dir = iraterm_dir / "backend"
    frontend_dir = iraterm_dir / "frontend"

    print("Installing IRATerm host services...")
    print(f"- backend dir: {backend_dir}")
    print(f"- frontend dir: {frontend_dir}")

    print("Building backend...")
    _run(["npm", "ci"], cwd=backend_dir)
    _run(["npm", "run", "build"], cwd=backend_dir)

    print("Building frontend...")
    _run(["npm", "ci"], cwd=frontend_dir)
    _run(
        ["npm", "run", "build"],
        cwd=frontend_dir,
        env={**os.environ, "VITE_TERMINAL_WS_URL": f"ws://localhost:{args.backend_port}/ws/terminal"},
    )

    backend_unit_path = Path("/etc/systemd/system/iranet-iraterm-backend.service")
    frontend_unit_path = Path("/etc/systemd/system/iranet-iraterm-frontend.service")

    _write_unit(
        backend_unit_path,
        content=_backend_unit(
            backend_dir=backend_dir,
            backend_port=args.backend_port,
            shell=args.shell,
        ),
    )
    _write_unit(
        frontend_unit_path,
        content=_frontend_unit(
            frontend_dir=frontend_dir,
            frontend_port=args.frontend_port,
        ),
    )

    print("Enabling and starting services...")
    _run(["systemctl", "daemon-reload"])
    _run(["systemctl", "enable", "--now", "iranet-iraterm-backend.service"])
    _run(["systemctl", "enable", "--now", "iranet-iraterm-frontend.service"])

    print("Done.")
    print(f"Frontend: http://localhost:{args.frontend_port}")
    print(f"Backend WS: ws://localhost:{args.backend_port}/ws/terminal")


if __name__ == "__main__":
    main()

