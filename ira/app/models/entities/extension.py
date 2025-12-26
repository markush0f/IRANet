from datetime import datetime
from sqlmodel import SQLModel, Field


class Extension(SQLModel, table=True):
    id: str = Field(primary_key=True)
    enabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
