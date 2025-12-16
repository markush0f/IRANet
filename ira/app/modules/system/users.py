from typing import List
from grp import getgrnam

import psutil

from app.modules.common.base import PASSWD_FILE
from app.modules.types.SYSTEM_USER import USER_TYPE, SystemUser

def system_users() -> List[SystemUser]:
    users: List[SystemUser] = []

    if not PASSWD_FILE.exists():
        return users

    with PASSWD_FILE.open() as file:
        for line in file:
            if not line.strip() or line.startswith("#"):
                continue

            parts = line.strip().split(":")
            if len(parts) < 7:
                continue

            username = parts[0]
            uid = int(parts[2])
            gid = int(parts[3])
            home = parts[5]
            shell = parts[6]

            user_type: USER_TYPE = "human" if uid >= 1000 else "system"

            users.append(
                {
                    "username": username,
                    "uid": uid,
                    "gid": gid,
                    "home": home,
                    "shell": shell,
                    "type": user_type,
                }
            )

    return users

def active_users():
    sessions = psutil.users()
    active_usernames = {session.name for session in sessions}

    return [
        user
        for user in system_users()
        if user["username"] in active_usernames
    ]

def sudo_users() -> list[str]:
    try:
        sudo_group = getgrnam("sudo")
        return sudo_group.gr_mem
    except KeyError:
        return []
    
    
def unused_users():
    active_names = {u["username"] for u in active_users()}
    return [
        u for u in system_users()
        if u["username"] not in active_names and u["type"] == "human"
    ]