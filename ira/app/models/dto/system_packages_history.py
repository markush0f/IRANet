from typing import List, Literal, TypedDict


AptAction = Literal["install", "upgrade", "remove"]


class SystemPackageHistoryEntry(TypedDict):
    date: str
    action: AptAction
    packages: List[str]
    command: str
