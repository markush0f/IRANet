from typing import Optional, Sequence, TypedDict


class ApplicationsLogsDTO(TypedDict):
    kind: str
    identifier: Optional[str]
    name: str

    workdir: str
    file_path: Optional[str]
    port: Optional[int]
    pid: Optional[int]

    log_paths: Sequence[str]
