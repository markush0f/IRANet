import json
import os
import socket
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv

from app.core.logger import get_logger


logger = get_logger(__name__)
load_dotenv(override=True)

def _get_local_hostname() -> str:
    return socket.gethostname()


def _get_local_ip() -> str | None:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


def get_server_id() -> str:
    server_id = os.getenv("IRA_SERVER_ID")
    if server_id:
        return server_id

    raise RuntimeError("IRA_SERVER_ID environment variable is required")


def get_server_hostname() -> str:
    return _get_local_hostname()


def get_server_ip() -> str | None:
    return _get_local_ip()


def get_server_display_name() -> str | None:
    return os.getenv("IRA_SERVER_NAME")


def get_agent_base_url() -> str | None:
    configured = os.getenv("IRA_AGENT_BASE_URL")
    if configured:
        return configured.rstrip("/")

    ip_address = get_server_ip()
    if not ip_address:
        return None

    port = os.getenv("IRA_AGENT_PORT", "8000").strip() or "8000"
    return f"http://{ip_address}:{port}"


def get_agent_shared_token() -> str | None:
    token = os.getenv("IRA_AGENT_SHARED_TOKEN")
    if token:
        return token
    return None


def get_server_environment() -> str | None:
    value = os.getenv("IRA_SERVER_ENVIRONMENT")
    if value:
        return value
    return None


def get_server_capabilities() -> list[str]:
    raw = os.getenv("IRA_SERVER_CAPABILITIES", "")
    return [value.strip() for value in raw.split(",") if value.strip()]


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


def get_database_dsn() -> str:
    dsn = os.getenv("IRA_DATABASE_DSN")
    if not dsn:
        raise RuntimeError("IRA_DATABASE_DSN environment variable is not set")

    if "+asyncpg" not in dsn:
        raise RuntimeError(
            "Async SQLAlchemy engine requires 'postgresql+asyncpg://' DSN"
        )

    return dsn
