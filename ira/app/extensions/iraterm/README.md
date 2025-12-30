# IRATerm (Docker)

IRATerm incluye:

- Backend (Fastify + WebSocket + `node-pty`) en `app/extensions/iraterm/backend` (puerto `3001`).
- Frontend (Vite) en `app/extensions/iraterm/frontend` (sirve estático con Nginx en el puerto `3000` del host).

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
