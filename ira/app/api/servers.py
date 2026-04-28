from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
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