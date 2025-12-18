from uuid import UUID
from typing import List, Optional

from app.infrastructure.logs.storage import insert_application_log
from app.infrastructure.logs.queries import query_application_logs
from app.modules.scanner.logs import detect_log_paths


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


async def list_logs_for_application(
    *,
    application_id: UUID,
) -> List[dict]:
    """
    Return all log paths associated with an application.
    """
    return await query_application_logs(
        application_id=application_id
    )
