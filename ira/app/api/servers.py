from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.repositories.servers import ServerRepository


router = APIRouter(prefix="/servers", tags=["servers"])


class CreateServerRequest(BaseModel):
    id: str
    hostname: str
    display_name: str | None = None
    ip_address: str | None = None


class UpdateServerRequest(BaseModel):
    display_name: str | None = None
    status: str | None = None


class InstallCommandResponse(BaseModel):
    server_id: str
    command: str
    instructions: str


@router.get("")
async def list_servers(
    session: AsyncSession = Depends(get_session),
):
    """
    Return all registered servers.
    """
    repo = ServerRepository(session)
    return await repo.list_all()


@router.post("")
async def create_server(
    data: CreateServerRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Pre-register a server before the agent connects.

    The agent will update its metadata (IP, version) on first heartbeat.
    """
    repo = ServerRepository(session)
    existing = await repo.get_by_id(data.id)
    if existing:
        raise HTTPException(status_code=409, detail="Server already exists")

    server = await repo.upsert(
        server_id=data.id,
        hostname=data.hostname,
        display_name=data.display_name,
        ip_address=data.ip_address,
    )
    return server


@router.get("/{server_id}")
async def get_server(
    server_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Return a single server by id.
    """
    repo = ServerRepository(session)
    server = await repo.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.patch("/{server_id}")
async def update_server(
    server_id: str,
    data: UpdateServerRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Update server metadata (display name, status).
    """
    repo = ServerRepository(session)
    server = await repo.update(
        server_id=server_id,
        display_name=data.display_name,
        status=data.status,
    )
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.delete("/{server_id}", status_code=204)
async def delete_server(
    server_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Remove a server. This does NOT uninstall the agent on that server.
    """
    repo = ServerRepository(session)
    deleted = await repo.delete(server_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Server not found")


@router.get("/{server_id}/install-command", response_model=InstallCommandResponse)
async def get_install_command(
    server_id: str,
    repo_url: str = Query(
        default="https://github.com/markush0f/IRANet",
        description="Git repo URL to clone IRA from",
    ),
    branch: str = Query(
        default="feature/multi-server-persistence",
        description="Git branch to install",
    ),
    database_dsn: str = Query(
        ...,
        description="PostgreSQL connection string for this server to use",
    ),
):
    """
    Generate the command to install the IRA agent on this server.

    The returned command is meant to be executed on the target server
    via SSH/terminal from your admin panel.

    Example usage from your panel:
        output = requests.get(f"http://iranet:8000/servers/{server_id}/install-command", params={
            "repo_url": "https://github.com/myuser/IRANet",
            "branch": "main",
            "database_dsn": "postgresql+asyncpg://ira:pass@iranet-db:5432/ira"
        })
        ssh_client.exec_command(output["command"])
    """
    install_script_url = f"{repo_url}/raw/{branch}/install.sh"

    command = (
        f"curl -sL {install_script_url} | bash -s -- "
        f"--server-id {server_id} "
        f"--database-dsn {database_dsn} "
        f"--repo {repo_url}"
    )

    instructions = (
        f"Paste and run this command on server '{server_id}' via SSH:\n\n"
        f"    {command}\n\n"
        f"The agent will:\n"
        f"  1. Clone IRA from {repo_url} (branch {branch})\n"
        f"  2. Install dependencies (Docker or Python)\n"
        f"  3. Create a systemd service 'ira-agent'\n"
        f"  4. Start the service and register with IRA\n\n"
        f"After installation, check status with:\n"
        f"    sudo systemctl status ira-agent\n\n"
        f"The server will appear in IRA within 10 seconds via heartbeat."
    )

    return InstallCommandResponse(
        server_id=server_id,
        command=command,
        instructions=instructions,
    )