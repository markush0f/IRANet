from typing import Any, Dict
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    name: str | None = Field(
        description="Name of the tool to execute, or null if no tool applies"
    )
    arguments: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arguments for the tool call"
    )
