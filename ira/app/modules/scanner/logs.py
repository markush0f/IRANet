from pathlib import Path
from typing import List
from uuid import UUID

from app.infrastructure.logs.queries import query_active_application_log_paths
from app.modules.logs.reader import read_last_lines
from app.modules.logs.resolver import resolve_log_files


def detect_log_paths(project_path: str) -> List[str]:
    """
    Detect log files inside a project directory.

    Returns only file paths, never directories.
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


async def get_application_log_file_history(
    *,
    application_id: UUID,
    file_path: str,
    limit: int = 200,
) -> List[str]:
    allowed_base_paths = await query_active_application_log_paths(
        application_id=application_id
    )

    requested = Path(file_path).resolve()

    for base_path in allowed_base_paths:
        base = Path(base_path).resolve()

        for log_file in resolve_log_files(str(base)):
            if Path(log_file).resolve() == requested:
                return read_last_lines(
                    path=str(requested),
                    limit=limit,
                )

    return []
