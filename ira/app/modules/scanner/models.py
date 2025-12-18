from dataclasses import dataclass
from typing import List, Optional


@dataclass(frozen=True)
class ScannedProcess:
    pid: int
    comm: str
    cmdline: List[str]
    cwd: str
    etimes: int
    file_path: Optional[str]
    port: Optional[int]
    npm_mode: Optional[str]


@dataclass
class ListeningPort:
    pid: int
    port: int
    protocol: str  # tcp | tcp6
