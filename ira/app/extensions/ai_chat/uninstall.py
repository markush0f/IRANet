#!/usr/bin/env python3
import os
import shutil
import subprocess
from pathlib import Path


# Global variables
EXTENSION_NAME = "ai_chat"
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_FILE = "qwen2.5-1.5b-instruct-q4_k_m.gguf"
DROP_MIGRATION_PATH = BASE_DIR / "migrations" / "999_drop.sql"


def _require_database_url() -> str:
    database_url = os.environ.get("IRA_DATABASE_DSN") or os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("IRA_DATABASE_DSN or DATABASE_URL is not set")
    if "+asyncpg" in database_url:
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return database_url


def _disable_extension(database_url: str) -> None:
    subprocess.run(
        [
            "psql",
            database_url,
            "-c",
            f"UPDATE extensions SET enabled = false WHERE id = '{EXTENSION_NAME}';",
        ],
        check=True,
        text=True,
    )


def _run_drop_migration(database_url: str, migration_path: Path) -> None:
    sql = migration_path.read_text(encoding="utf-8")
    subprocess.run(
        ["psql", database_url],
        input=sql,
        text=True,
        check=True,
    )


def main() -> None:
    print(f"Uninstalling extension: {EXTENSION_NAME}")

    database_url = _require_database_url()

    print("Disabling extension in database...")
    _disable_extension(database_url)

    print("Dropping database tables...")
    _run_drop_migration(database_url, DROP_MIGRATION_PATH)

    if MODEL_DIR.exists():
        print("Removing model directory...")
        shutil.rmtree(MODEL_DIR)
    else:
        print("Model directory not found, skipping")

    print(f"Extension {EXTENSION_NAME} uninstalled successfully")


if __name__ == "__main__":
    main()
