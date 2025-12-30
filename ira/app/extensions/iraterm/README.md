# IRATerm (Docker)

IRATerm incluye:

- Backend (Fastify + WebSocket + `node-pty`) en `app/extensions/iraterm/backend` (puerto `3001`).
- Frontend (Vite) en `app/extensions/iraterm/frontend` (sirve estático con Nginx).

## Instalación como extensión (IRANet)

Al habilitar la extensión `iraterm` desde IRANet, el instalador puede funcionar en dos modos:

- **Docker (por defecto si hay Docker disponible)**: levanta **dos contenedores separados** (`iranet-iraterm-backend` y `iranet-iraterm-frontend`) usando el Docker daemon del host.
- **Proceso (host)**: levanta backend y frontend como **procesos del host** (esto es lo que necesitas si quieres que la terminal sea la del SO del host).

El modo se controla con `IRATERM_RUN_MODE`:

- `auto` (default): usa Docker si está disponible; si no, intenta modo proceso; si IRANet corre en Docker sin acceso a Docker, cae a `external`.
- `docker`: fuerza Docker.
- `process`: fuerza modo proceso (solo funciona si IRANet corre en el host, no dentro de Docker).
- `external`: no inicia nada; asume que backend/frontend ya están corriendo en el host (por ejemplo con systemd).

- Frontend: por defecto `http://localhost:3010` (se guarda en `app/extensions/iraterm/frontend.port`)
- WebSocket backend: se expone en un puerto libre `3001-3010` (se guarda en `app/extensions/iraterm/backend.port`)

## Host services (systemd)

Ver `app/extensions/iraterm/host/README.md`.

## Levantar con Docker Compose

Desde `app/extensions/iraterm/`:

```bash
docker compose up --build
```

Luego:

- Frontend: `http://localhost:3000`
- WebSocket backend: `ws://localhost:3001/ws/terminal`

## Variables

- `VITE_TERMINAL_WS_URL`: URL del WebSocket (se inyecta en build del frontend).
- `SHELL`: shell que usa `node-pty` dentro del contenedor (por defecto `/bin/bash`).
