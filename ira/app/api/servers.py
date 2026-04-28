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
    database_dsn: str = Query(
        ...,
        description="PostgreSQL connection string for this server to use",
    ),
    method: str = Query(
        default="pull",
        description="Installation method: pull (Docker image), build (Docker from source), python (no Docker)",
    ),
    image: str = Query(
        default="ghcr.io/markush0f/iranet/ira-agent:latest",
        description="Docker image URL for pull method",
    ),
    repo_url: str = Query(
        default="https://github.com/markush0f/IRANet",
        description="Git repo URL for build/python methods",
    ),
    branch: str = Query(
        default="main",
        description="Git branch to install",
    ),
):
    """
    Generate the command to install the IRA agent on this server.

    The returned command is meant to be executed on the target server
    via SSH/terminal from your admin panel.

    Methods:
    - pull:    Downloads a pre-built Docker image (fastest, needs Docker)
    - build:  Clones repo and builds Docker image (needs Docker + build tools)
    - python: Installs Python dependencies directly (no Docker required)

    Example usage from your panel:
        resp = requests.get(
            f"http://iranet:8000/servers/{server_id}/install-command",
            params={
                "database_dsn": "postgresql+asyncpg://ira:pass@iranet-db:5432/ira",
                "method": "pull",
            }
        )
        ssh.exec_command(resp.json()["command"])
    """
    if method not in ("pull", "build", "python"):
        raise HTTPException(
            status_code=400,
            detail="method must be one of: pull, build, python"
        )

    install_script_url = f"{repo_url}/raw/{branch}/install.sh"

    cmd_parts = [
        f"curl -sL {install_script_url} | bash -s --",
        f"--server-id {server_id}",
        f"--database-dsn {database_dsn}",
    ]

    if method == "pull":
        cmd_parts.append(f"--method pull")
        cmd_parts.append(f"--image {image}")
    elif method == "build":
        cmd_parts.append(f"--method build")
        cmd_parts.append(f"--repo {repo_url}")
        cmd_parts.append(f"--branch {branch}")
    else:
        cmd_parts.append(f"--method python")
        cmd_parts.append(f"--repo {repo_url}")
        cmd_parts.append(f"--branch {branch}")

    command = " ".join(cmd_parts)

    method_descriptions = {
        "pull": f"Downloads pre-built image `{image}` (fastest)",
        "build": f"Clones {repo_url} branch {branch} and builds Docker image",
        "python": f"Clones {repo_url} branch {branch} and installs Python deps directly (no Docker)",
    }

    instructions = (
        f"Run this command on server '{server_id}' via SSH:\n\n"
        f"    {command}\n\n"
        f"Method: {method_descriptions[method]}\n\n"
        f"The agent will:\n"
        f"  1. {'Pull Docker image' if method == 'pull' else 'Clone IRA from ' + repo_url}\n"
        f"  2. {'Start container' if method == 'pull' else 'Install and start service'}\n"
        f"  3. Register with IRA automatically\n\n"
        f"Check status:\n"
        f"    sudo systemctl status ira-agent\n\n"
        f"Server appears in IRA within 10 seconds via heartbeat."
    )

    return InstallCommandResponse(
        server_id=server_id,
        method=method,
        command=command,
        instructions=instructions,
    )