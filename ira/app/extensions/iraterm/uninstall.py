#!/usr/bin/env python3
import shutil
from pathlib import Path


EXTENSION_NAME = "iraterm"
BASE_DIR = Path(__file__).resolve().parent
BACKEND_NODE_MODULES = BASE_DIR / "backend" / "node_modules"
FRONTEND_NODE_MODULES = BASE_DIR / "frontend" / "node_modules"


def _remove_node_modules(path: Path) -> None:
    if path.exists():
        print(f"Removing {path}...")
        shutil.rmtree(path)
    else:
        print(f"{path} not found, skipping")


def main() -> None:
    print(f"Uninstalling extension: {EXTENSION_NAME}")

    _remove_node_modules(BACKEND_NODE_MODULES)
    _remove_node_modules(FRONTEND_NODE_MODULES)

    print(f"Extension {EXTENSION_NAME} uninstalled successfully")


if __name__ == "__main__":
    main()
