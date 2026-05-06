# IRANet

IRANet is a **read-only observability and system introspection platform** for Linux servers, designed for developers and technical teams who need real visibility into what is actually running on a host.

Instead of relying on predefined services or manual configuration, IRANet **automatically inspects the system** and exposes structured information through an API and a web dashboard. The platform is intentionally **read-only**: it provides visibility without allowing remote execution or system modification.

This repository contains both the backend and frontend components of IRANet.

---

## Deployment Model

IRANet uses a single deployment model:

- one frontend
- one or more IRANet backends
- one shared PostgreSQL database

Each backend monitors only its own server and writes metrics, alerts, applications, and heartbeat data into the same PostgreSQL database. The frontend loads the registered server list and lets you choose which backend to view.

```
┌─────────────┐         ┌──────────────────┐
│   Browser   │◄───────►│     Backend      │
└─────────────┘         │  selected server │
                        └────────┬─────────┘
                                 │
               ┌─────────────────┴─────────────────┐
               │                                   │
         ┌─────▼─────┐                       ┌─────▼─────┐
         │ Backend 1 │                       │ Backend 2 │
         │ server_1  │                       │ server_2  │
         └─────┬─────┘                       └─────┬─────┘
               │                                   │
               └──────────────┬────────────────────┘
                              │
                        ┌─────▼─────┐
                        │PostgreSQL │
                        │ shared DB │
                        └───────────┘
```

Each backend registers:
- `server_id` — unique identifier for the monitored server
- `hostname` — machine hostname for display
- `ip_address` — detected automatically on heartbeat

---

## What IRANet Does

IRANet automatically discovers and exposes:

* Docker services and running containers
* systemd services, including Nginx
* Automatically detected databases
* Running processes and long‑living applications
* System users
* All installed packages on the server
* System and application logs (with log visualization)
* Resource metrics (CPU, memory, disk, network)
* Calculated metrics per detected application

The dashboard is accessible to any user but **no actions can be executed on the host** from the UI.

---

## Project Status

This is a **first functional version (v1)** focused on discovery, metrics, and visibility.

Current work in progress includes:

* Linux system‑based authentication
* Extensions system
* Developer mode for custom tooling and experimentation

---

## Architecture Overview

IRANet is split into two main components:

### Backend

* Async API built in Python
* Modular collectors for system, services, processes, metrics, and logs
* PostgreSQL-backed persistence for historical data
* Designed to run as a long‑living service on a Linux host or VPS
* Scopes all persisted data by `server_id` and keeps the shared DB updated via heartbeat

### Frontend

* Modern web dashboard built with TypeScript
* Focused on developer usability and system visibility
* Communicates exclusively with the backend API
* Includes a server selector dropdown in the sidebar

---

## Requirements

### Docker (recommended)

* Docker Engine
* Docker Compose v2

### Local development

Backend:

* Python 3.11+
* pip + virtualenv or Poetry
* PostgreSQL 16+

Frontend:

* Node.js 18+
* npm (or pnpm/yarn)

---

## Running the Project (Docker)

### Docker stacks

```bash
cd docker
docker compose -f compose.db.yml up -d
```

Deploy each stack where it belongs:

1. `compose.db.yml`
   Run on the central PostgreSQL host.
2. `compose.backend.yml`
   Run on every monitored server. This is the reusable backend stack.
3. `compose.frontend.yml`
   Run once on the central frontend host.

Environment examples are available in `docker/`:

* `.env.db.example`
* `.env.backend.example`
* `.env.frontend.example`

Examples:

```bash
# Central database host
cd docker
cp .env.db.example .env.db
docker compose --env-file .env.db -f compose.db.yml up -d

# Backend on a monitored server
cd docker
cp .env.backend.example .env.backend
docker compose --env-file .env.backend -f compose.backend.yml up -d --build

# Single frontend host
cd docker
cp .env.frontend.example .env.frontend
docker compose --env-file .env.frontend -f compose.frontend.yml up -d --build
```

Notes:

* `compose.backend.yml` is reused on each server and connects all backends to the same PostgreSQL database.
* The frontend is static and must point to one backend URL for bootstrap through `VITE_API_BASE_URL`.
* After loading the server list, the frontend can switch to the selected server backend using each server's registered backend URL.

Common endpoints after startup:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API on each server: `http://<server-ip>:8000`
* PostgreSQL: `5432`

Stop services:

```bash
docker compose --env-file .env.db -f compose.db.yml down
docker compose --env-file .env.backend -f compose.backend.yml down
docker compose --env-file .env.frontend -f compose.frontend.yml down
```

### All‑in‑One (single server)

To run everything on one machine, combine the three stacks:

```bash
cd docker
docker compose \
  -f compose.db.yml \
  -f compose.backend.yml \
  -f compose.frontend.yml \
  up -d --build
```

Result:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

Or use the helper scripts:

```bash
cd docker
./up.sh    # start all
./down.sh  # stop all
```

### Shared PostgreSQL

`IRA_DATABASE_DSN` is mandatory. Every backend connects to the same PostgreSQL database and:

1. Registers itself in `servers`
2. Writes metrics, alerts, and applications under its `server_id`
3. Updates its `ip_address` every 5 seconds via heartbeat

### Remote installation from your own panel

If you already have a frontend or admin panel that manages your servers, the recommended flow is:

1. Register or update the server in IRANet.
2. Call `GET /servers/{server_id}/install-command` with:
   - `database_dsn`
   - `backend_base_url`
   - optional metadata like `server_name`, `environment`, and `capabilities`
3. Execute the returned command on the target server via SSH from your own backend.
4. Wait for heartbeat and confirm the server appears in `/servers`.

Example:

```bash
curl "http://iranet-api:8000/servers/server-01/install-command?database_dsn=postgresql%2Basyncpg%3A%2F%2Firanet%3Apass%40db.example.com%3A5432%2Firanet&backend_base_url=http%3A%2F%2F10.0.0.21%3A8000&server_name=Production%2001&environment=production"
```

The returned command is Docker-based and can be executed remotely with SSH.

---

## Running the Backend (Local)

### Backend

```bash
cd ira
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export IRA_DATABASE_DSN="postgresql+asyncpg://user:password@localhost:5432/iranet"
export IRA_SERVER_ID="server-01"
python3 -m app.main
```

Optional overrides:

```bash
export IRA_SERVER_ID="my-server-id"
export IRA_SERVER_NAME="My Server Display Name"
```

### Server Identity (how it works)

| Environment variable | Default | Description |
|---|---|---|
| `IRA_SERVER_ID` | _(none)_ | Unique identifier for this backend |
| `IRA_SERVER_NAME` | `hostname` | Human-readable name |
| `IRA_DATABASE_DSN` | _(none)_ | Required PostgreSQL DSN |

The backend detects its local IP by connecting to `8.8.8.8:80` (no external traffic, just routing table lookup).

---

## Running the Frontend (Local)

```bash
cd frontend
npm install
npm run dev
```

Point the frontend at any reachable IRANet backend for bootstrap:

```bash
export VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

The development server URL will be shown in the console.

---

## Configuration

### Backend environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `IRA_DATABASE_DSN` | Yes | _(none)_ | `postgresql+asyncpg://...` connection string |
| `IRA_SERVER_ID` | Yes | _(none)_ | Unique server identifier |
| `IRA_SERVER_NAME` | No | `hostname` | Override server display name |
| `IRA_CONFIG_PATH` | No | `app/config/ira.config.json` | Path to JSON config file |

### Frontend environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_SERVER_ID` | _(none)_ | Default server selected on load |

---

## Security Model

* Read‑only access by design
* No remote command execution
* No system mutation from the UI
* No authentication in v1

It is recommended to deploy IRANet in trusted networks or behind a reverse proxy.

---

## License

MIT
