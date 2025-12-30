## IRATerm (host services)

Si quieres que IRATerm abra **la terminal del host** (no la del contenedor), el backend debe ejecutarse como proceso del host.

Este directorio trae scripts para instalar IRATerm como servicios `systemd` en Linux (Ubuntu/Debian, etc).

### Instalar (requiere root)

Desde la raíz del repo de IRANet:

```bash
sudo python3 app/extensions/iraterm/host/install_services.py
```

Opciones:

```bash
sudo python3 app/extensions/iraterm/host/install_services.py --backend-port 3001 --frontend-port 3010 --shell /bin/bash
```

### Desinstalar / detener

```bash
sudo python3 app/extensions/iraterm/host/uninstall_services.py
```

### IRANet en Docker

Si IRANet está corriendo dentro de Docker y quieres usar estos servicios del host, en IRANet configura:

- `IRATERM_RUN_MODE=external`
- `IRATERM_EXTERNAL_BACKEND_PORT=3001` (o el que uses)
- `IRATERM_EXTERNAL_FRONTEND_PORT=3010` (o el que uses)

