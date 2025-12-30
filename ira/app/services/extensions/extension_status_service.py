from pathlib import Path
from app.models.dto.extension_status_dto import ExtensionStatusDTO


class ExtensionStatusService:
    def __init__(self) -> None:
        self._extensions_base_dir = Path(__file__).resolve().parents[2] / "extensions"

    def get_status(self, extension_id: str) -> ExtensionStatusDTO:
        extension_dir = self._extensions_base_dir / extension_id

        frontend_port_file = extension_dir / "frontend.port"
        backend_port_file = extension_dir / "backend.port"

        if not extension_dir.exists():
            return ExtensionStatusDTO(
                id=extension_id,
                enabled=False,
                frontend_url=None,
                backend_port=None,
            )

        frontend_url = None
        backend_port = None

        if frontend_port_file.exists():
            frontend_port = frontend_port_file.read_text().strip()
            frontend_url = f"http://127.0.0.1:{frontend_port}"

        if backend_port_file.exists():
            backend_port = int(backend_port_file.read_text().strip())

        return ExtensionStatusDTO(
            id=extension_id,
            enabled=True,
            frontend_url=frontend_url,
            backend_port=backend_port,
        )
