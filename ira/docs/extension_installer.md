# Como crear un instalador de extension

Este documento explica como agregar un instalador y desinstalador para una
extension y como conectarlo con el flujo de habilitar/deshabilitar.

## Estructura recomendada

Para una extension llamada `mi_extension`:

```
app/extensions/mi_extension/
  install.py
  uninstall.py
  migrations/
    001_init.sql
    999_drop.sql
  models/
```

## Scripts de instalacion y desinstalacion

Los scripts deben ser ejecutables como modulo Python y exponer `main()`.

Ejemplo base:

```python
#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
EXTENSION_NAME = "mi_extension"
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
    database_url = _require_database_url()
    _run_migration(database_url, MIGRATION_PATH)

if __name__ == "__main__":
    main()
```

## Script para crear la estructura automaticamente

Existe un script que crea la estructura base de una extension:

```
python app/services/extensions/create_extension_scaffold.py mi_extension
```

Esto genera:

```
app/extensions/mi_extension/
  install.py
  uninstall.py
  migrations/
    001_init.sql
    999_drop.sql
  models/
```

Luego ajusta los paths y agrega las migraciones reales.

## Registro en el registry

Edita `app/services/extensions/extensions_registry.py` y agrega la extension:

```python
from app.extensions.mi_extension import install as mi_install
from app.extensions.mi_extension import uninstall as mi_uninstall

INSTALLER = {
    "mi_extension": mi_install,
}

UNINSTALLER = {
    "mi_extension": mi_uninstall,
}
```

## Flujo de habilitar/deshabilitar

Cuando se llama:

- `enable_extension(extension_id="mi_extension")`
  - ejecuta el instalador si existe en `INSTALLER`
  - actualiza la extension a `enabled=True`

- `disable_extension(extension_id="mi_extension")`
  - ejecuta el desinstalador si existe en `UNINSTALLER`
  - actualiza la extension a `enabled=False`

Este flujo esta en `app/services/extensions/extensions.py`.

## Variables de entorno

Para migraciones con `psql`, el instalador usa:

- `IRA_DATABASE_DSN` (preferido) o
- `DATABASE_URL`

Si usas async DSN (`postgresql+asyncpg://`), se convierte automaticamente
a `postgresql://` para `psql`.

## Consejos

- Usa rutas absolutas basadas en `__file__` para evitar errores de ruta.
- Si descargas modelos, usa un directorio dentro de la extension
  (`app/extensions/mi_extension/models/`).
- Si necesitas parametros extra, encapsulalos en funciones auxiliares y
  registra solo `main()` en el registry.
