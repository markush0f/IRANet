from pathlib import Path
from typing import List, Dict
from datetime import datetime


def list_log_files(
    *,
    directory: str,
) -> List[Dict]:
    """
    List log files inside a directory with basic metadata.

    Returned fields:
    - name
    - path
    - created_at
    """
    base = Path(directory)

    if not base.exists() or not base.is_dir():
        return []

    files: List[Dict] = []

    for file in base.iterdir():
        if not file.is_file():
            continue

        stat = file.stat()

        files.append(
            {
                "name": file.name,
                "path": str(file),
                "created_at": datetime.fromtimestamp(stat.st_ctime),
            }
        )

    return files
