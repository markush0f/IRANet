from __future__ import annotations

import importlib
import importlib.util
from dataclasses import dataclass
from pathlib import Path
from types import ModuleType


@dataclass(frozen=True)
class _ModuleMainProxy:
    module_path: str

    def _import(self) -> ModuleType:
        return importlib.import_module(self.module_path)

    def main(self) -> None:
        module = self._import()
        main = getattr(module, "main", None)
        if not callable(main):
            raise AttributeError(f"{self.module_path}.main is not callable")
        main()


def _extensions_base_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "extensions"


def _list_extension_ids() -> list[str]:
    base_dir = _extensions_base_dir()
    if not base_dir.exists():
        return []

    extension_ids: list[str] = []
    for path in base_dir.iterdir():
        name = path.name
        if not path.is_dir():
            continue
        if name.startswith(".") or name.startswith("_") or name == "__pycache__":
            continue
        extension_ids.append(name)

    extension_ids.sort()
    return extension_ids


def _build_registry(module_suffix: str) -> dict[str, _ModuleMainProxy]:
    registry: dict[str, _ModuleMainProxy] = {}
    for extension_id in _list_extension_ids():
        module_path = f"app.extensions.{extension_id}.{module_suffix}"
        try:
            spec = importlib.util.find_spec(module_path)
        except (ImportError, ValueError):
            continue
        if spec is None:
            continue
        registry[extension_id] = _ModuleMainProxy(module_path=module_path)
    return registry


INSTALLER: dict[str, _ModuleMainProxy] = {}
UNINSTALLER: dict[str, _ModuleMainProxy] = {}


def refresh_registries() -> None:
    installer = _build_registry("install")
    uninstaller = _build_registry("uninstall")

    INSTALLER.clear()
    INSTALLER.update(installer)

    UNINSTALLER.clear()
    UNINSTALLER.update(uninstaller)


refresh_registries()
