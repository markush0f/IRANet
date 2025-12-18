from pathlib import Path
from typing import List


def detect_log_paths(project_path: str) -> List[str]:
    """
    Detect common log paths inside a project directory.

    Only existing paths are returned.
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
        if path.exists():
            detected.append(str(path))

    return detected
