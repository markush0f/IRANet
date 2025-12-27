from fastapi import APIRouter, Depends
from app.core.database import get_session
from app.core.logger import get_logger
from app.services.extensions import ExtensionsService
from sqlmodel.ext.asyncio.session import AsyncSession


logger = get_logger(__name__)

router = APIRouter(prefix="/extensions", tags=["extensions"])


@router.get("/all")
async def get_extensions(
    session: AsyncSession = Depends(get_session),
):
    service = ExtensionsService(session)
    return await service.get_all_extensions()


@router.put("/{extension_id}/enable")
async def enable_extension(
    extension_id: str,
    session: AsyncSession = Depends(get_session),
):
    service = ExtensionsService(session)
    return await service.enable_extension(extension_id=extension_id)


@router.put("/{extension_id}/disable")
async def disable_extension(
    extension_id: str,
    session: AsyncSession = Depends(get_session),
):
    service = ExtensionsService(session)
    return await service.disable_extension(extension_id=extension_id)
