from typing import Optional, Sequence, TypedDict
from uuid import UUID


class ApplicationsLogsDTO(TypedDict):
    id: UUID
    kind: str
    identifier: Optional[str]
    name: str

    workdir: str
    file_path: Optional[str]
    port: Optional[int]
    pid: Optional[int]

    log_paths: Sequence[str]
