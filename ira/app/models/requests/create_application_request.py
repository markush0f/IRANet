from typing import List, Optional
from pydantic import BaseModel


class CreateApplicationRequest(BaseModel):
    cwd: str
    name: str
    log_paths: Optional[List[str]]
