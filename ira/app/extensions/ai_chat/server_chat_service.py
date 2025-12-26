import json

from app.extensions.ai_chat.dispatcher import ToolDispatcher
from app.extensions.ai_chat.initializer import ModelInterpreter
from app.extensions.ai_chat.models import ToolCall
from app.extensions.ai_chat.prompt_builder import build_prompt

class ServerChatService:
    def __init__(
        self,
        *,
        model_interpreter: ModelInterpreter,
        dispatcher: ToolDispatcher,
        tools_schema: dict,
    ):
        self._interpreter = model_interpreter
        self._dispatcher = dispatcher
        self._tools_schema = tools_schema

    def ask(self, *, question: str):
        prompt = build_prompt(
            user_message=question,
            tools=self._tools_schema,
        )

        raw_output = self._interpreter.interpret(
            prompt=prompt,
            stop=["\n\n"],
        )

        tool_call = ToolCall(**json.loads(raw_output))
        return self._dispatcher.execute(tool_call)
