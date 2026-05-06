from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.server_scope import ensure_local_server
from app.services.user_system_service import UsersSystemService



router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("")
async def list_all_users(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = UsersSystemService()
    return {
        "users": service.get_all_users(),
    }


@router.get("/login-allowed")
async def list_login_allowed_users(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = UsersSystemService()
    return {
        "users": service.get_login_allowed_users(),
    }


@router.get("/active")
async def list_active_users(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = UsersSystemService()
    return {
        "users": service.get_active_users(),
    }


@router.get("/summary")
async def users_summary(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = UsersSystemService()

    return service.get_users_summary()

@router.get("/human")
async def list_human_users(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = UsersSystemService()

    return {
        "users": service.get_human_users(),
    }

@router.get("/system")
async def list_system_users(
    server_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    ensure_local_server(server_id)
    service = UsersSystemService()

    return {
        "users": service.get_system_users(),
    }
