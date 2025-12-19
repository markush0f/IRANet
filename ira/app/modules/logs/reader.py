from pathlib import Path
from typing import List

from app.core.logger import get_logger
logger = get_logger(__name__)


def read_last_lines(path: str, limit: int = 200) -> List[str]:
    logger.info(f"Reading last {limit} lines from log file {path}")
    file_path = Path(path)

    if not file_path.exists() or not file_path.is_file():
        logger.warning(f"Log file {path} does not exist or is not a file")
        return []

    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        logger.info(f"Read {len(lines)} lines from log file {path}")

    return lines[-limit:]
