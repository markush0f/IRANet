import asyncio
from uuid import UUID
from typing import AsyncIterator, Dict, List, Optional

from fastapi import WebSocket
from app.core.logger import get_logger
from app.core.websocket_manager import ws_manager

from app.infrastructure.logs.storage import insert_application_log
from app.infrastructure.logs.queries import (
    query_active_application_log_paths,
)
from app.modules.logs.inspector import list_log_files
from app.modules.logs.reader import read_last_lines
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


async def stream_application_logs(
    *,
    application_id: UUID,
    websocket: WebSocket,
    poll_interval: float = 0.5,
) -> None:
    channel = f"logs:{application_id}"

    await ws_manager.connect(channel, websocket)

    paths = await query_active_application_log_paths(application_id=application_id)

    tasks = []

    async def forward(path: str, stream: AsyncIterator[str]) -> None:
        async for line in stream:
            await ws_manager.broadcast(
                channel,
                {
                    "path": path,
                    "message": line,
                },
            )

    try:
        for path in paths:
            stream = tail_file(
                path=path,
                interval=poll_interval,
            )

            tasks.append(asyncio.create_task(forward(path, stream)))

        await asyncio.gather(*tasks)

    finally:
        ws_manager.disconnect(channel, websocket)
        for task in tasks:
            task.cancel()


async def get_application_logs_history(
    *,
    application_id: UUID,
    limit: int = 200,
) -> Dict[str, List[str]]:
    paths = await query_active_application_log_paths(application_id=application_id)

    logger.info(
        f"Fetching log history for application {application_id} with paths: {paths}"
    )

    history: Dict[str, List[str]] = {}

    for path in paths:
        history[path] = read_last_lines(
            path=path,
            limit=limit,
        )

    return history


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
