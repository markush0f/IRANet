from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.repositories.servers import ServerRepository


router = APIRouter(prefix="/servers", tags=["servers"])


@router.get("")
async def list_servers(
    session: AsyncSession = Depends(get_session),
):
    """
    Return all registered servers.
    """
    repo = ServerRepository(session)
    return await repo.list_all()