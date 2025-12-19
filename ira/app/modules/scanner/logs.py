from pathlib import Path
from typing import List


def detect_log_paths(project_path: str) -> List[str]:
    """
    Detect log files inside a project directory.

    Returns only file paths.
    """
    base = Path(project_path)

    candidates = [
        base / "logs",
        base / "log",
        base / "app.log",
        base / "application.log",
    ]

    detected: List[str] = []

    for path in candidates:
        if not path.exists():
            continue

        if path.is_file():
            detected.append(str(path))
            continue

        if path.is_dir():
            for log_file in path.rglob("*.log"):
                if log_file.is_file():
                    detected.append(str(log_file))

    return detected
