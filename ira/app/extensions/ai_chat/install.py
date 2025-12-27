#!/usr/bin/env python3
import os
import shutil
import subprocess
from pathlib import Path
from urllib.request import urlopen


# Global variables
EXTENSION_NAME = "ai_chat"
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_FILE = "qwen2.5-1.5b-instruct-q4_k_m.gguf"
MODEL_URL = (
    "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/"
    "qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true"
)
MIGRATIONS_DIR = BASE_DIR / "migrations"
MIGRATION_PATH = MIGRATIONS_DIR / "001_init_.sql"


def _require_database_url() -> str:
    database_url = os.environ.get("IRA_DATABASE_DSN") or os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("IRA_DATABASE_DSN or DATABASE_URL is not set")
    if "+asyncpg" in database_url:
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return database_url


def _download_model(destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)

    with urlopen(MODEL_URL) as response:
        with destination.open("wb") as out:
            shutil.copyfileobj(response, out)


def _run_migration(database_url: str, migration_path: Path) -> None:
    sql = migration_path.read_text(encoding="utf-8")
    subprocess.run(
        ["psql", database_url],
        input=sql,
        text=True,
        check=True,
    )


def _run_migrations(database_url: str, migrations_dir: Path) -> None:
    migration_paths = sorted(migrations_dir.glob("*.sql"))
    for path in migration_paths:
        if path.name.startswith("999_"):
            continue
        _run_migration(database_url, path)


def main() -> None:
    print(f"Installing extension: {EXTENSION_NAME}")

    model_path = MODEL_DIR / MODEL_FILE
    if not model_path.exists():
        print("Downloading model...")
        _download_model(model_path)
    else:
        print("Model already exists, skipping download")

    print("Applying database migrations...")
    database_url = _require_database_url()
    _run_migrations(database_url, MIGRATIONS_DIR)

    print(f"Extension {EXTENSION_NAME} installed successfully")


if __name__ == "__main__":
    main()
