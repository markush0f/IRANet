from dataclasses import dataclass
from typing import Optional


@dataclass
class SimpleService:
    id: str
    description: Optional[str]
    active_state: str
    sub_state: str
    main_pid: int
    user: Optional[str]
    group: Optional[str]
    working_directory: Optional[str]
    exec_start: Optional[str]
    restarts: int
    result: Optional[str]
    exec_main_code: Optional[str]
    exec_main_status: Optional[int]
    cpu_usage_ns: Optional[int]
    memory_current: Optional[int]
    memory_peak: Optional[int]
    tasks_current: Optional[int]
