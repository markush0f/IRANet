from fastapi import APIRouter

from app.services.user_system_service import UsersSystemService



router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("")
def list_all_users():
    service = UsersSystemService()
    return {
        "users": service.get_all_users(),
    }


@router.get("/login-allowed")
def list_login_allowed_users():
    service = UsersSystemService()
    return {
        "users": service.get_login_allowed_users(),
    }


@router.get("/active")
def list_active_users():
    service = UsersSystemService()
    return {
        "users": service.get_active_users(),
    }


@router.get("/summary")
def users_summary():
    service = UsersSystemService()

    return service.get_users_summary()

@router.get("/human")
def list_human_users():
    service = UsersSystemService()

    return {
        "users": service.get_human_users(),
    }

@router.get("/system")
def list_system_users():
    service = UsersSystemService()

    return {
        "users": service.get_system_users(),
    }