import json
from pathlib import Path
from typing import Dict, Any


def load_tools_registry(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)