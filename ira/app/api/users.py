from fastapi import APIRouter

from app.services.user.service import (
    get_active_users,
    get_all_users,
    get_human_users,
    get_login_allowed_users,
    get_system_users,
    get_users_summary,
)

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("")
def list_all_users():
    return {
        "users": get_all_users(),
    }


@router.get("/login-allowed")
def list_login_allowed_users():
    return {
        "users": get_login_allowed_users(),
    }


@router.get("/active")
def list_active_users():
    return {
        "users": get_active_users(),
    }


@router.get("/summary")
def users_summary():
    return get_users_summary()

@router.get("/human")
def list_human_users():
    return {
        "users": get_human_users(),
    }

@router.get("/system")
def list_system_users():
    return {
        "users": get_system_users(),
    }