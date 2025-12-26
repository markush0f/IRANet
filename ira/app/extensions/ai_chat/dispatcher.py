import importlib
from pathlib import Path
from typing import Any, Dict, cast

from extensions.ai_chat.argumen_validator import ToolArgumentValidationError, validate_arguments
from extensions.ai_chat.loader import load_tools_registry
from extensions.ai_chat.models import ToolCall


class ToolDispatcher:
    def __init__(self, *, tools_path: Path):
        self._registry: Dict[str, Any] = load_tools_registry(tools_path)

    def execute(self, tool_call: ToolCall) -> dict:
        if tool_call.name is None:
            return {
                "executed": False,
                "reason": "no_tool_selected",
            }

        tool_def = self._registry.get(tool_call.name)

        if not tool_def:
            return {
                "executed": False,
                "error": f"Tool '{tool_call.name}' is not allowed",
            }

        try:
            module_path, func_name = tool_def["handler"].rsplit(".", 1)
            module = importlib.import_module(module_path)
            handler = getattr(module, func_name)
            tool_def = self._registry.get(tool_call.name)

            if tool_def is None:
                return {
                    "executed": False,
                    "error": f"Tool '{tool_call.name}' is not allowed",
                }

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
            result = handler(**tool_call.arguments)

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
