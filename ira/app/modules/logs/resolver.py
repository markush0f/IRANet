from pathlib import Path
from typing import List


def resolve_log_files(path: str) -> List[str]:
    """
    Resolve a log path into concrete log files.

    - If path is a file, return it
    - If path is a directory, return *.log files inside
    """
    base = Path(path)

    if not base.exists():
        return []

    if base.is_file():
        return [str(base)]

    if base.is_dir():
        return [
            str(p)
            for p in base.iterdir()
            if p.is_file() and p.suffix == ".log"
        ]

    return []
