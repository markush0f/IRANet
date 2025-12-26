import json
from typing import Any, Dict

from app.extensions.ai_chat.core.dispatcher import ToolDispatcher
from app.extensions.ai_chat.llm.model_interpreter import ModelInterpreter
from app.extensions.ai_chat.core.models import ToolCall
from app.extensions.ai_chat.prompts.prompt_builder import build_prompt


class ServerChatService:
    def __init__(
        self,
        *,
        model_interpreter: ModelInterpreter,
        dispatcher: ToolDispatcher,
        tools_schema: Dict[str, Any],
    ):
        self._interpreter = model_interpreter
        self._dispatcher = dispatcher
        self._tools_schema = tools_schema

    def ask(self, *, question: str) -> dict:
        prompt = build_prompt(
            user_message=question,
            tools=self._tools_schema,
        )

        raw_output = self._interpreter.interpret(
            prompt=prompt,
            stop=["\n\n"],
        )

        try:
            payload = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            return {
                "executed": False,
                "error": "invalid_model_output",
                "raw_output": raw_output,
            }

        try:
            tool_call = ToolCall(**payload)
        except TypeError as exc:
            return {
                "executed": False,
                "error": "invalid_tool_call_schema",
                "details": str(exc),
                "payload": payload,
            }

        return self._dispatcher.execute(tool_call)
