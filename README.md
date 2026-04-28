# IRANet

IRANet is a **read-only observability and system introspection platform** for Linux servers, designed for developers and technical teams who need real visibility into what is actually running on a host.

Instead of relying on predefined services or manual configuration, IRANet **automatically inspects the system** and exposes structured information through an API and a web dashboard. The platform is intentionally **read-only**: it provides visibility without allowing remote execution or system modification.

This repository contains both the backend (agent) and frontend components of IRANet.

---

## Operation Modes

IRANet supports two deployment modes:

### Single‑Server Mode (default)

The agent runs locally and the frontend connects directly to it at `http://localhost:8000`. No external database is required — all data is ephemeral and in-memory. Useful for local development or single-machine monitoring.

```
┌─────────────┐         ┌──────────────────┐
│   Browser   │◄───────►│  IRANet Agent   │
└─────────────┘         │  (backend)       │
                        │  localhost:8000  │
                        └──────────────────┘
```

### Multi‑Server Mode

Multiple agents report to a **central PostgreSQL database**. Each agent is identified by a unique `server_id` (derived from its hostname hash) and scopes all metrics, alerts, and applications under that identity. The frontend connects to the API server and lets you **select which server to view** from a dropdown in the sidebar.

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Browser   │◄───────►│   API Server     │◄───────►│   PostgreSQL     │
└─────────────┘         │  (backend:8000)  │         │  (shared DB)     │
                        └────────┬─────────┘         └──────────────────┘
                                 │ ▲
                    ┌────────────┴─┴────────────┐
                    │                            │
              ┌─────▼─────┐              ┌─────▼─────┐
              │  Agent 1  │              │  Agent 2  │
              │ (server_1)│              │ (server_2)│
              └───────────┘              └───────────┘
```

In this mode every agent sends:
- **server_id** — `sha256(hostname)[:32]` derived from the machine's hostname (no env vars needed)
- **hostname** — the actual machine hostname for display
- **ip_address** — detected automatically on each heartbeat (every 5 seconds)

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

### Backend (Agent)

* Async API built in Python
* Modular collectors for system, services, processes, metrics, and logs
* Optional persistence layer for historical metrics
* Designed to run as a long‑living service on a Linux host or VPS
* In multi-server mode, scopes all data by `server_id` and keeps the central DB updated via heartbeat

### Frontend

* Modern web dashboard built with TypeScript
* Focused on developer usability and system visibility
* Communicates exclusively with the backend API
* In multi-server mode, includes a server selector dropdown in the sidebar

---

## Requirements

### Docker (recommended)

* Docker Engine
* Docker Compose v2

### Local development

Backend:

* Python 3.11+
* pip + virtualenv or Poetry
* PostgreSQL 16+ (for multi-server mode)

Frontend:

* Node.js 18+
* npm (or pnpm/yarn)

---

## Running the Project (Docker)

### Using the Docker Compose setup

```bash
cd docker
docker compose up --build
```

After startup:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:8000](http://localhost:8000)

Stop services:

```bash
docker compose down
```

### Single‑Server Mode (no database)

In single-server mode the agent runs without a database. The frontend connects directly to the local agent. This is the default when `IRA_DATABASE_DSN` is not set.

### Multi‑Server Mode (with central PostgreSQL)

When `IRA_DATABASE_DSN` is provided, the agent connects to a shared PostgreSQL database and:

1. Computes its `server_id` from the machine hostname (`sha256(hostname)[:32]`) if `IRA_SERVER_ID` is not set
2. Auto-registers itself on first heartbeat (upsert)
3. Updates its `ip_address` every 5 seconds via heartbeat

---

## Running the Backend (Local)

### Single‑Server Mode

```bash
cd ira
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

### Multi‑Server Mode

```bash
export IRA_DATABASE_DSN="postgresql+asyncpg://user:password@localhost:5432/iranet"
python -m app.main
```

Optional overrides (all have sensible defaults):

```bash
# Override auto-detected server ID and display name
export IRA_SERVER_ID="my-server-id"
export IRA_SERVER_NAME="My Server Display Name"
```

### Server Identity (how it works)

| Environment variable | Default | Description |
|---|---|---|
| `IRA_SERVER_ID` | `sha256(hostname)[:32]` | Unique identifier for this agent |
| `IRA_SERVER_NAME` | `hostname` | Human-readable name |
| `IRA_DATABASE_DSN` | _(none)_ | PostgreSQL DSN. If set, multi-server mode is activated |

The agent detects its local IP by connecting to `8.8.8.8:80` (no external traffic, just routing table lookup).

---

## Running the Frontend (Local)

```bash
cd frontend
npm install
npm run dev
```

For multi-server mode, point the frontend at the API server:

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
| `IRA_DATABASE_DSN` | Multi-server only | _(none)_ | `postgresql+asyncpg://...` connection string |
| `IRA_SERVER_ID` | No | `sha256(hostname)[:32]` | Override server identifier |
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