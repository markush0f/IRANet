# IRANet

English version: [`README.md`](./README.md)

IRANet es una plataforma de observabilidad e introspección de sistemas Linux en modo solo lectura. Descubre qué se está ejecutando realmente en cada servidor y expone esa información mediante una API backend y un frontend web.

La plataforma está diseñada intencionadamente en modo solo lectura: da visibilidad sobre servidores, procesos, servicios, paquetes, logs y métricas sin permitir ejecución remota desde la propia UI de IRANet.

## Resumen

IRANet está pensado para un despliegue con:

- una base de datos PostgreSQL compartida
- un frontend
- un backend de IRANet por cada servidor monitorizado

Cada backend monitoriza únicamente su propio host y escribe los datos en la misma PostgreSQL. El frontend puede cambiar entre servidores y hablar con el backend seleccionado para obtener datos live.

```text
                    +----------------------+
                    |      Frontend        |
                    | selector de servidor |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Backend seleccionado |
                    |   peticiones live    |
                    +----------+-----------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+---------------+                             +---------------+
|   Backend A   |                             |   Backend B   |
|   server-a    |                             |   server-b    |
+-------+-------+                             +-------+-------+
        |                                             |
        +----------------------+----------------------+
                               |
                               v
                    +----------------------+
                    |      PostgreSQL      |
                    | persistencia común   |
                    +----------------------+
```

## Qué recopila IRANet

IRANet puede descubrir y exponer:

- contenedores y servicios Docker
- servicios systemd
- bases de datos detectadas
- procesos en ejecución
- aplicaciones de larga duración
- usuarios del sistema
- paquetes instalados e historial de paquetes
- logs del sistema y logs de aplicaciones
- métricas del sistema
- métricas runtime por aplicación
- histórico de alertas

## Arquitectura final

IRANet sigue ahora un único modelo de arquitectura.

### Backend

Cada backend:

- corre en un único servidor
- monitoriza solo ese servidor local
- escribe todos los datos persistentes en la PostgreSQL compartida
- se registra en la tabla `servers`
- actualiza periódicamente su heartbeat
- sirve peticiones live solo de su propio host

### Frontend

El frontend:

- arranca desde cualquier URL de backend accesible
- carga la lista de servidores desde PostgreSQL
- permite elegir qué servidor inspeccionar
- usa la URL del backend seleccionado para las vistas live

### PostgreSQL

PostgreSQL es obligatoria.

Todos los backends deben apuntar al mismo `IRA_DATABASE_DSN`.

Esa base de datos compartida almacena:

- servidores
- aplicaciones
- métricas de aplicaciones
- métricas del sistema
- alertas
- extensiones

## Reglas importantes de ejecución

- `IRA_DATABASE_DSN` es obligatoria
- `IRA_SERVER_ID` es obligatoria
- cada backend debe tener un `IRA_SERVER_ID` único
- todos los backends deben apuntar a la misma PostgreSQL
- los endpoints live solo operan sobre el servidor local del backend
- los datos históricos se comparten a través de PostgreSQL

## Requisitos

### Backend

- Python 3.11+
- PostgreSQL 16+
- host Linux

### Frontend

- Node.js 18+
- npm, pnpm o yarn

### Despliegue recomendado

- Docker Engine
- Docker Compose v2

## Despliegue con Docker

El repositorio incluye tres stacks Compose:

- `docker/compose.db.yml`
- `docker/compose.backend.yml`
- `docker/compose.frontend.yml`

### 1. Host central de PostgreSQL

```bash
cd docker
cp .env.db.example .env.db
docker compose --env-file .env.db -f compose.db.yml up -d
```

### 2. Un backend por cada servidor monitorizado

```bash
cd docker
cp .env.backend.example .env.backend
docker compose --env-file .env.backend -f compose.backend.yml up -d --build
```

### 3. Un único host para el frontend

```bash
cd docker
cp .env.frontend.example .env.frontend
docker compose --env-file .env.frontend -f compose.frontend.yml up -d --build
```

### Notas

- `compose.backend.yml` se reutiliza en cada servidor monitorizado
- todos los backends usan el mismo DSN de PostgreSQL
- el frontend solo necesita una URL de backend para arrancar
- tras arrancar, el frontend puede cambiar a la URL del backend del servidor seleccionado

### Entorno all-in-one local

Si quieres ejecutar todo en una sola máquina para desarrollo:

```bash
cd docker
docker compose \
  -f compose.db.yml \
  -f compose.backend.yml \
  -f compose.frontend.yml \
  up -d --build
```

O usar los scripts auxiliares:

```bash
cd docker
./up.sh
./down.sh
```

## Variables de entorno del backend

### Obligatorias

| Variable | Descripción |
|---|---|
| `IRA_DATABASE_DSN` | DSN compartido de PostgreSQL, por ejemplo `postgresql+asyncpg://user:pass@db:5432/iranet` |
| `IRA_SERVER_ID` | Identificador único de este backend/servidor |

### Opcionales

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `IRA_SERVER_NAME` | hostname | Nombre legible del servidor |
| `IRA_AGENT_BASE_URL` | vacío | URL pública del backend de este servidor |
| `IRA_AGENT_PORT` | `8000` | Puerto del backend |
| `IRA_SERVER_ENVIRONMENT` | `production` | Etiqueta de entorno |
| `IRA_SERVER_CAPABILITIES` | lista integrada | Lista de capacidades separadas por comas |
| `IRA_CONFIG_PATH` | `app/config/ira.config.json` | Ruta del JSON de configuración |

## Variables de entorno del frontend

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | URL del backend usada para bootstrap |
| `VITE_SERVER_ID` | vacío | Servidor seleccionado inicialmente |

## Ejecutar el backend en local

```bash
cd ira
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export IRA_DATABASE_DSN="postgresql+asyncpg://user:password@localhost:5432/iranet"
export IRA_SERVER_ID="server-01"
export IRA_SERVER_NAME="Server 01"
export IRA_AGENT_BASE_URL="http://127.0.0.1:8000"

python3 -m app.main
```

## Ejecutar el frontend en local

```bash
cd frontend
npm install
export VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```

## Instalar un backend remotamente desde tu propio panel

Este es el flujo operativo más importante si ya tienes tu propio frontend o panel de gestión de servidores.

El modelo previsto es:

1. tu panel guarda credenciales y metadata del servidor
2. tu backend llama a IRANet para generar un comando de instalación
3. tu backend ejecuta ese comando por SSH en el servidor destino
4. el nuevo backend arranca, se conecta a PostgreSQL y se registra automáticamente

### Paso 1. Crear o actualizar el registro del servidor

Puedes prerregistrar un servidor en IRANet usando la API `servers`.

Ejemplo de body:

```json
{
  "id": "server-01",
  "hostname": "server-01",
  "display_name": "Production 01",
  "agent_base_url": "http://10.0.0.21:8000",
  "environment": "production",
  "capabilities": [
    "system",
    "processes",
    "services",
    "logs",
    "packages",
    "users",
    "metrics"
  ]
}
```

### Paso 2. Pedir a IRANet un comando Docker de instalación

Usa:

```text
GET /servers/{server_id}/install-command
```

Parámetros soportados:

- `database_dsn` obligatorio
- `image` opcional
- `server_name` opcional
- `backend_base_url` opcional
- `backend_port` opcional
- `environment` opcional
- `capabilities` opcional
- `repo_url` opcional, solo para localizar `install.sh`
- `branch` opcional, solo para localizar `install.sh`

Ejemplo:

```bash
curl "http://iranet-api:8000/servers/server-01/install-command?database_dsn=postgresql%2Basyncpg%3A%2F%2Firanet%3Apass%40db.example.com%3A5432%2Firanet&backend_base_url=http%3A%2F%2F10.0.0.21%3A8000&server_name=Production%2001&environment=production&capabilities=system,processes,services,logs,packages,users,metrics"
```

La API devuelve un comando de instalación por Docker que tu backend puede ejecutar por SSH.

### Paso 3. Ejecutar el comando por SSH

Tu frontend no debería ejecutar SSH directamente. Eso debería hacerlo tu propio backend.

Flujo recomendado:

1. el usuario pulsa `Instalar IRANet`
2. tu frontend llama a tu backend
3. tu backend pide `/servers/{server_id}/install-command`
4. tu backend ejecuta `response.command` por SSH en el servidor destino
5. tu backend hace polling a `/servers/{server_id}` hasta ver heartbeat

Pseudoflujo:

```ts
const installResp = await fetch(`${IRANET_API}/servers/${serverId}/install-command?...`);
const installData = await installResp.json();

await ssh.execCommand(installData.command);
```

### Inicio rápido en español

Si ya tienes tu propio panel para gestionar servidores, este es el flujo más corto para instalar el backend en un servidor remoto:

1. Crea o actualiza el registro del servidor en IRANet.
2. Pide a IRANet un comando de instalación por Docker.
3. Ejecuta ese comando por SSH en el servidor destino.
4. Espera al heartbeat del backend.

Ejemplo:

```bash
curl "http://iranet-api:8000/servers/server-01/install-command?database_dsn=postgresql%2Basyncpg%3A%2F%2Firanet%3Apass%40db.example.com%3A5432%2Firanet&backend_base_url=http%3A%2F%2F10.0.0.21%3A8000&server_name=Production%2001&environment=production&capabilities=system,processes,services,logs,packages,users,metrics"
```

IRANet devuelve un comando parecido a este:

```bash
curl -sL https://github.com/markush0f/IRANet/raw/main/ira/install.sh | bash -s -- --server-id server-01 --database-dsn postgresql+asyncpg://iranet:pass@db.example.com:5432/iranet --method pull --image ghcr.io/markush0f/iranet/ira-backend:latest --server-name "Production 01" --backend-base-url http://10.0.0.21:8000 --environment production --capabilities system,processes,services,logs,packages,users,metrics
```

Después ejecútalo en el servidor remoto por SSH desde tu propio backend.

Comprobar estado en el servidor destino:

```bash
sudo systemctl status iranet-backend
sudo journalctl -u iranet-backend -f
```

### Qué hace el instalador

El comando generado descarga `ira/install.sh` y después:

- hace pull de la imagen Docker
- crea o reemplaza el servicio `iranet-backend` en systemd
- configura todas las variables de entorno necesarias de IRANet
- arranca el backend
- deja que se registre por heartbeat

### Imagen Docker usada

Imagen por defecto:

```text
ghcr.io/markush0f/iranet/ira-backend:latest
```

### Resultado en el servidor destino

La máquina remota termina con un servicio `systemd` llamado:

```text
iranet-backend
```

Comandos útiles en el servidor destino:

```bash
sudo systemctl status iranet-backend
sudo journalctl -u iranet-backend -f
```

## Datos live vs datos históricos

Esta diferencia es importante.

### Datos live

Los endpoints live deben ir contra el backend seleccionado directamente.

Ejemplos:

- snapshot del sistema
- procesos en ejecución
- usuarios
- estado actual de paquetes
- discovery de aplicaciones
- streaming de logs
- inspección runtime de procesos

### Datos históricos

Los datos históricos se comparten a través de PostgreSQL.

Ejemplos:

- métricas almacenadas
- histórico de alertas
- aplicaciones registradas
- inventario de servidores
- histórico de métricas por aplicación

## Notas de seguridad

- IRANet en sí es solo lectura
- la UI de IRANet no ejecuta comandos sobre servidores
- si instalas remotamente desde tu panel, la ejecución SSH pertenece a tu backend, no al frontend de IRANet
- despliega detrás de un reverse proxy o dentro de redes confiables
- asegura correctamente el acceso a PostgreSQL

## Nota de terminología actual

Algunos nombres internos aún usan `agent_base_url` por razones históricas.

En la arquitectura actual, ese campo debe entenderse como:

- la URL pública del backend de ese servidor

## Licencia

MIT
