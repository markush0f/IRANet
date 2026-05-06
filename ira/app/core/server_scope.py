from fastapi import HTTPException

from app.core.config import get_server_id


def ensure_local_server(server_id: str | None) -> None:
    if server_id is None:
        return

    local_server_id = get_server_id()
    if server_id != local_server_id:
        raise HTTPException(
            status_code=409,
            detail=(
                f"server_id '{server_id}' does not belong to this backend "
                f"(local server_id is '{local_server_id}')"
            ),
        )
