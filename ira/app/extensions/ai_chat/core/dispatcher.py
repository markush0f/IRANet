import importlib
from pathlib import Path
from typing import Any, Dict, cast

from app.extensions.ai_chat.core.argumen_validator import (
    ToolArgumentValidationError,
    validate_arguments,
)
from app.extensions.ai_chat.tools.loader import load_tools_registry
from app.extensions.ai_chat.core.models import ToolCall


class ToolDispatcher:
    def __init__(self) -> None:
        TOOLS_REGISTRY_PATH = Path("app/extensions/ai_chat/tools/tools_calls.json")

        self._registry: Dict[str, Any] = load_tools_registry(TOOLS_REGISTRY_PATH)

    def execute(self, tool_call: ToolCall) -> dict:
        if tool_call.name is None:
            return {
                "executed": False,
                "reason": "no_tool_selected",
            }

        tool_def = self._registry.get(tool_call.name)

        if tool_def is None:
            return {
                "executed": False,
                "error": f"Tool '{tool_call.name}' is not allowed",
            }

        try:
            module_path, func_name = tool_def["handler"].rsplit(".", 1)
            module = importlib.import_module(module_path)
            handler = getattr(module, func_name)

            tool_def = cast(Dict[str, Any], tool_def)
            arguments_schema = tool_def.get("arguments", {})

            try:
                validated_arguments = validate_arguments(
                    provided=tool_call.arguments,
                    schema=arguments_schema,
                )
            except ToolArgumentValidationError as exc:
                return {
                    "executed": False,
                    "tool": tool_call.name,
                    "error": str(exc),
                }

            result = handler(**validated_arguments)

            return {
                "executed": True,
                "tool": tool_call.name,
                "result": result,
            }

        except Exception as exc:
            return {
                "executed": False,
                "tool": tool_call.name,
                "error": str(exc),
            }
