from app.modules.systemd.simple.discovery import discover_simple_services


class SimpleServicesService:
    def get_simple_services(
        self,
        limit
    ):
        simple_service = discover_simple_services(limit)
        return simple_service