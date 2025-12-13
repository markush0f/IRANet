import json
import os
from pathlib import Path
from typing import Any, Dict

from app.core.logger import get_logger


logger = get_logger(__name__)


def load_config() -> Dict[str, Any]:
    """
    Load the IRA configuration from a JSON file.

    Priority:
    1. Path defined in IRA_CONFIG_PATH (Docker / production)
    2. Local config inside app/config/ira.config.json (development)
    """
    env_path = os.getenv("IRA_CONFIG_PATH")

    if env_path:
        config_path = Path(env_path)
        logger.info("Loading configuration from IRA_CONFIG_PATH: %s", config_path)
    else:
        base_dir = Path(__file__).resolve().parents[1]
        config_path = base_dir / "config" / "ira.config.json"
        logger.info("Loading configuration from default path: %s", config_path)

    if not config_path.exists():
        logger.error("Config file not found at '%s'", config_path)
        raise RuntimeError(f"Config file not found at '{config_path}'")

    with config_path.open("r", encoding="utf-8") as f:
        config = json.load(f)

    logger.info("Configuration loaded successfully")
    return config
