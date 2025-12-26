from pathlib import Path
from app.extensions.ai_chat.core.chat_service import ServerChatService
from app.extensions.ai_chat.core.dispatcher import ToolDispatcher
from app.extensions.ai_chat.llm.model_interpreter import ModelInterpreter
from app.extensions.ai_chat.tools.loader import load_tools_registry


_chat_service: ServerChatService | None = None


def get_chat_service() -> ServerChatService:
    global _chat_service

    if _chat_service is None:
        tools_schema = load_tools_registry(
            Path("app/extensions/ai_chat/tools/registry.json")
        )
        interpreter = ModelInterpreter(
            model_path="models/phi-3-mini/Phi-3-mini-4k-instruct-q4.gguf"
        )

        dispatcher = ToolDispatcher()

        _chat_service = ServerChatService(
            model_interpreter=interpreter,
            dispatcher=dispatcher,
            tools_schema=tools_schema,
        )

    return _chat_service
