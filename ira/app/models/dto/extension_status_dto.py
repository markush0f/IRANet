from pydantic import BaseModel
from typing import Optional


class ExtensionStatusDTO(BaseModel):
    id: str
    enabled: bool
    frontend_url: Optional[str]
    backend_port: Optional[int]
