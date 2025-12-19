from pathlib import Path
from typing import List


def resolve_log_files(base_path: str) -> List[str]:
    """
    Resolve a base log path into concrete log files.
    """
    base = Path(base_path)

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
