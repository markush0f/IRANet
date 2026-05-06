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
    agent_base_url: str | None = None
    environment: str | None = None
    capabilities: list[str] | None = None


class UpdateServerRequest(BaseModel):
    display_name: str | None = None
    status: str | None = None
    agent_base_url: str | None = None
    environment: str | None = None
    capabilities: list[str] | None = None


class InstallCommandResponse(BaseModel):
    server_id: str
    method: str
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
        agent_base_url=data.agent_base_url,
        environment=data.environment,
        capabilities=data.capabilities,
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
        agent_base_url=data.agent_base_url,
        environment=data.environment,
        capabilities=data.capabilities,
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
    database_dsn: str = Query(
        ...,
        description="PostgreSQL connection string for this server to use",
    ),
    image: str = Query(
        default="ghcr.io/markush0f/iranet/ira-backend:latest",
        description="Docker image URL to install on the target server",
    ),
    server_name: str | None = Query(
        default=None,
        description="Human-readable server name to register",
    ),
    backend_base_url: str | None = Query(
        default=None,
        description="Public backend URL for this server, for example http://10.0.0.21:8000",
    ),
    backend_port: int = Query(
        default=8000,
        ge=1,
        le=65535,
        description="Backend listen port exposed on the target server",
    ),
    environment: str | None = Query(
        default=None,
        description="Environment label to register, for example production or staging",
    ),
    capabilities: str | None = Query(
        default=None,
        description="Comma-separated capabilities to register",
    ),
    repo_url: str = Query(
        default="https://github.com/markush0f/IRANet",
        description="Git repo URL where install.sh is published",
    ),
    branch: str = Query(
        default="main",
        description="Git branch used to fetch install.sh",
    ),
):
    """
    Generate the Docker installation command for the IRANet backend on this server.

    The returned command is meant to be executed on the target server
    via SSH/terminal from your admin panel.

    Example usage from your panel:
        resp = requests.get(
            f"http://iranet:8000/servers/{server_id}/install-command",
            params={
                "database_dsn": "postgresql+asyncpg://ira:pass@iranet-db:5432/ira",
                "backend_base_url": "http://10.0.0.21:8000",
            }
        )
        ssh.exec_command(resp.json()["command"])
    """
    install_script_url = f"{repo_url}/raw/{branch}/install.sh"

    cmd_parts = [
        f"curl -sL {install_script_url} | bash -s --",
        f"--server-id {server_id}",
        f"--database-dsn {database_dsn}",
        f"--method pull",
        f"--image {image}",
    ]

    if server_name:
        cmd_parts.append(f"--server-name {server_name}")
    if backend_base_url:
        cmd_parts.append(f"--backend-base-url {backend_base_url}")
    if backend_port != 8000:
        cmd_parts.append(f"--backend-port {backend_port}")
    if environment:
        cmd_parts.append(f"--environment {environment}")
    if capabilities:
        cmd_parts.append(f"--capabilities {capabilities}")

    command = " ".join(cmd_parts)

    instructions = (
        f"Run this command on server '{server_id}' via SSH:\n\n"
        f"    {command}\n\n"
        f"Method: pull pre-built Docker image `{image}`\n\n"
        f"The backend will:\n"
        f"  1. Pull the Docker image\n"
        f"  2. Create or replace the `iranet-backend` systemd service\n"
        f"  3. Register with IRANet automatically\n\n"
        f"Check status:\n"
        f"    sudo systemctl status iranet-backend\n\n"
        f"Server appears in IRANet within 10 seconds via heartbeat."
    )

    return InstallCommandResponse(
        server_id=server_id,
        method="pull",
        command=command,
        instructions=instructions,
    )
