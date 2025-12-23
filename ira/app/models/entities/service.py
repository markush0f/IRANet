from typing import Optional
from pydantic import BaseModel

class Service(BaseModel):
    name: str
    source: str  # systemd | docker | port
    status: str
    process: Optional[str] = None
    image: Optional[str] = None
    port: Optional[int] = None
    pid: Optional[int] = None
