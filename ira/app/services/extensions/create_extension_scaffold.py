#!/usr/bin/env python3
import argparse
from pathlib import Path


def _snake_case(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raise FileExistsError(f"File already exists: {path}")
    path.write_text(content, encoding="utf-8")


def _create_structure(base_dir: Path, extension_name: str) -> None:
    extension_dir = base_dir / extension_name
    migrations_dir = extension_dir / "migrations"
    models_dir = extension_dir / "models"

    migrations_dir.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)

    install_py = extension_dir / "install.py"
    uninstall_py = extension_dir / "uninstall.py"
    init_sql = migrations_dir / "001_init.sql"
    drop_sql = migrations_dir / "999_drop.sql"

    _write_file(
        install_py,
        f"""#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
EXTENSION_NAME = "{extension_name}"
MODEL_DIR = BASE_DIR / "models"
MODEL_FILE = ""
MODEL_URL = ""
MIGRATION_PATH = BASE_DIR / "migrations" / "001_init.sql"


def _require_database_url() -> str:
    dsn = os.environ.get("IRA_DATABASE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("IRA_DATABASE_DSN or DATABASE_URL is not set")
    if "+asyncpg" in dsn:
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    return dsn


def _run_migration(database_url: str, migration_path: Path) -> None:
    sql = migration_path.read_text(encoding="utf-8")
    subprocess.run(["psql", database_url], input=sql, text=True, check=True)


def main() -> None:
    print(f"Installing extension: {{EXTENSION_NAME}}")
    database_url = _require_database_url()
    _run_migration(database_url, MIGRATION_PATH)
    print(f"Extension {{EXTENSION_NAME}} installed successfully")


if __name__ == "__main__":
    main()
""",
    )

    _write_file(
        uninstall_py,
        f"""#!/usr/bin/env python3
import os
import shutil
import subprocess
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
EXTENSION_NAME = "{extension_name}"
MODEL_DIR = BASE_DIR / "models"
MODEL_FILE = ""
DROP_MIGRATION_PATH = BASE_DIR / "migrations" / "999_drop.sql"


def _require_database_url() -> str:
    dsn = os.environ.get("IRA_DATABASE_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("IRA_DATABASE_DSN or DATABASE_URL is not set")
    if "+asyncpg" in dsn:
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    return dsn


def _disable_extension(database_url: str) -> None:
    subprocess.run(
        [
            "psql",
            database_url,
            "-c",
            f"UPDATE extensions SET enabled = false WHERE id = '{{EXTENSION_NAME}}';",
        ],
        check=True,
        text=True,
    )


def _run_drop_migration(database_url: str, migration_path: Path) -> None:
    sql = migration_path.read_text(encoding="utf-8")
    subprocess.run(["psql", database_url], input=sql, text=True, check=True)


def main() -> None:
    print(f"Uninstalling extension: {{EXTENSION_NAME}}")
    database_url = _require_database_url()
    _disable_extension(database_url)
    _run_drop_migration(database_url, DROP_MIGRATION_PATH)
    if MODEL_DIR.exists():
        shutil.rmtree(MODEL_DIR)
    print(f"Extension {{EXTENSION_NAME}} uninstalled successfully")


if __name__ == "__main__":
    main()
""",
    )

    _write_file(init_sql, "-- TODO: add init SQL for this extension\n")
    _write_file(drop_sql, "-- TODO: add drop SQL for this extension\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create extension scaffold under app/extensions"
    )
    parser.add_argument("name", help="Extension name (e.g. ai_chat)")
    args = parser.parse_args()

    extension_name = _snake_case(args.name)
    base_dir = Path("app/extensions")
    _create_structure(base_dir, extension_name)
    print(f"Created extension scaffold at {base_dir / extension_name}")


if __name__ == "__main__":
    main()
