import asyncio
from uuid import UUID
from typing import AsyncIterator, Dict, List, Optional
from pathlib import Path

from fastapi import WebSocket
from app.core.logger import get_logger
from app.core.websocket_manager import ws_manager

from app.infrastructure.logs.storage import insert_application_log
from app.infrastructure.logs.queries import (
    query_active_application_log_paths,
)
from app.modules.logs.inspector import list_log_files
from app.modules.logs.reader import read_last_lines
from app.modules.logs.resolver import resolve_log_files
from app.modules.logs.tail import tail_file
from app.modules.scanner.logs import detect_log_paths


logger = get_logger(__name__)


async def attach_logs_to_application(
    *,
    application_id: UUID,
    workdir: str,
    manual_paths: Optional[List[str]] = None,
) -> None:
    """
    Attach log paths to an application.

    If manual_paths are provided, they are used.
    Otherwise, log paths are auto-detected from the project directory.
    """
    if manual_paths:
        paths = manual_paths
        discovered = False
    else:
        paths = detect_log_paths(workdir)
        discovered = True

    for path in paths:
        await insert_application_log(
            application_id=application_id,
            path=path,
            discovered=discovered,
            enabled=True,
        )


async def stream_application_log_file(
    *,
    application_id: UUID,
    file_path: str,
    websocket: WebSocket,
    poll_interval: float = 0.5,
) -> None:
    await websocket.accept()

    allowed_base_paths = await query_active_application_log_paths(
        application_id=application_id
    )

    requested = Path(file_path).resolve()

    if not requested.exists() or not requested.is_file():
        await websocket.close(code=4000)
        return

    if not _is_allowed_log_file(
        requested=requested,
        allowed_base_paths=allowed_base_paths,
    ):
        await websocket.close(code=4001)
        return

    async for line in tail_file(
        path=str(requested),
        interval=poll_interval,
    ):
        await websocket.send_json(
            {
                "path": str(requested),
                "message": line,
            }
        )


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
        for log_file in resolve_log_files(base_path):
            if Path(log_file).resolve() == requested:
                return read_last_lines(
                    path=log_file,
                    limit=limit,
                )

    return []


async def get_application_log_files(
    *,
    application_id: UUID,
    page: int = 1,
    page_size: int = 20,
) -> Dict:
    paths = await query_active_application_log_paths(application_id=application_id)

    all_files: List[Dict] = []

    for path in paths:
        all_files.extend(list_log_files(directory=path))

    all_files.sort(
        key=lambda f: f["created_at"],
        reverse=True,
    )

    total = len(all_files)
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": all_files[start:end],
    }


def _is_allowed_log_file(
    *,
    requested: Path,
    allowed_base_paths: list[str],
) -> bool:
    for base_path in allowed_base_paths:
        for log_file in resolve_log_files(base_path):
            if Path(log_file).resolve() == requested:
                return True
    return False
