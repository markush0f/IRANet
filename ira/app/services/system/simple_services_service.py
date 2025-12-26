from app.modules.systemd.simple.discovery import discover_simple_services
from app.extensions.ai_chat.tools.registry import tool_class


@tool_class(name_prefix="system_simple")
class SimpleServicesService:
    def get_simple_services(
        self,
        limit
    ):
        simple_service = discover_simple_services(limit)
        return simple_service
