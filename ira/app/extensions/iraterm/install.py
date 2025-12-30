#!/usr/bin/env python3
import subprocess
from pathlib import Path


EXTENSION_NAME = "iraterm"
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"


def _run_npm_install(path: Path) -> None:
    if not path.exists():
        raise RuntimeError(f"Directory not found: {path}")

    print(f"Running npm install in {path.name}...")
    subprocess.run(
        ["npm", "install"],
        cwd=path,
        check=True,
    )


def main() -> None:
    print(f"Installing extension: {EXTENSION_NAME}")

    _run_npm_install(BACKEND_DIR)
    _run_npm_install(FRONTEND_DIR)

    print(f"Extension {EXTENSION_NAME} installed successfully")


if __name__ == "__main__":
    main()
