from app.modules.system.users import active_users, system_users


class UsersService:
    def get_all_users(self):
        return system_users()

    def get_login_allowed_users(self):
        return [
            user
            for user in system_users()
            if user["shell"] not in ("/usr/sbin/nologin", "/bin/false")
        ]

    def get_active_users(self):
        return active_users()

    def get_users_summary(self) -> dict:
        users = system_users()
        active = active_users()
        login_allowed = [
            u for u in users
            if u["shell"] not in ("/usr/sbin/nologin", "/bin/false")
        ]

        active_usernames = {u["username"] for u in active}

        return {
            "total": len(users),
            "human": len([u for u in users if u["type"] == "human"]),
            "system": len([u for u in users if u["type"] == "system"]),
            "login_allowed": len(login_allowed),
            "active": len(active),
            "active_users": list(active_usernames),
        }

    def get_human_users(self):
        return [user for user in system_users() if user["type"] == "human"]

    def get_system_users(self):
        return [user for user in system_users() if user["type"] == "system"]
