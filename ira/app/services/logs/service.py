from uuid import UUID
from typing import List

from app.infrastructure.logs.storage import insert_application_log
from app.modules.scanner.logs import detect_log_paths
from app.infrastructure.logs.queries import (
    query_application_logs,
)


async def attach_discovered_logs(
    *,
    application_id: UUID,
    workdir: str,
) -> None:
    paths = detect_log_paths(workdir)

    for path in paths:
        await insert_application_log(
            application_id=application_id,
            path=path,
            discovered=True,
            enabled=True,
        )


async def list_logs_for_application(
    *,
    application_id: UUID,
) -> List[dict]:
    return await query_application_logs(
        application_id=application_id
    )
