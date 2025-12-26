import json
from pathlib import Path
from typing import Dict, Any


def load_tools_registry(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"No existe el archivo de registro de herramientas: {path}")
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)
