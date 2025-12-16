from typing import TypedDict, Literal


USER_TYPE = Literal["system", "human"]


class SystemUser(TypedDict):
    username: str
    uid: int
    gid: int
    home: str
    shell: str
    type: USER_TYPE
