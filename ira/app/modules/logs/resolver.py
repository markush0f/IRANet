from pathlib import Path
from typing import List


def resolve_log_files(base_path: str) -> List[str]:
    """
    Resolve a base log path into concrete log files.

    - If base_path is a file, return it
    - If base_path is a directory, recursively find log files
    - Supports rotated logs (e.g. .log.1, .log.2025-01-01)
    """
    base = Path(base_path)

    if not base.exists():
        return []

    if base.is_file():
        return [str(base)]

    log_files: List[str] = []

    if base.is_dir():
        for path in base.rglob("*"):
            if not path.is_file():
                continue

            name = path.name.lower()

            if name.endswith(".log") or ".log." in name:
                log_files.append(str(path))

    return log_files
