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

    async def ask(self, *, question: str) -> dict:
        prompt = build_prompt(
            user_message=question,
            tools=self._tools_schema,
        )

        raw_output = self._interpreter.interpret(
            prompt=prompt,
            stop=["<END_JSON>"],
        )

        payload = self._parse_tool_payload(raw_output)
        if payload is None:
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

        return await self._dispatcher.execute(tool_call)

    def _parse_tool_payload(self, raw_output: str) -> dict | None:
        # Find first JSON object only
        start = raw_output.find("{")
        if start == -1:
            return None

        depth = 0
        for i in range(start, len(raw_output)):
            if raw_output[i] == "{":
                depth += 1
            elif raw_output[i] == "}":
                depth -= 1
                if depth == 0:
                    json_str = raw_output[start : i + 1]
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        return None

        return None
