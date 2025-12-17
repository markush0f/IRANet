# IRANet – Roadmap de Auto‑descubrimiento de Aplicaciones

Este documento define **qué es una aplicación detectable**, **cómo se identifica**, **cómo se persiste** y **qué pasos hay que implementar** para soportar procesos tipo `uvicorn`, `node`, `npm run dev`, etc., con vistas a crecer después hacia métricas, logs y alertas.

---

## 1. Definición de “Aplicación Detectable”

Una **aplicación detectable** es un **proceso persistente** ejecutado por el usuario que representa un servicio lógico del sistema, aunque **no esté registrado en systemd**.

Características mínimas:

* Proceso persistente (vive más de X segundos)
* Ejecuta un fichero principal o script reconocible
* Representa una unidad lógica (backend, frontend, worker, etc.)
* Puede reiniciarse (PID cambia) sin dejar de ser la misma app

Quedan **fuera de alcance (por ahora)**:

* Scripts puntuales
* Procesos del sistema
* Cron jobs
* Docker / Kubernetes

---

## 2. Regla de Identidad (Concepto Clave)

* Un **proceso es efímero**
* Una **aplicación es persistente**

Por tanto:

* ❌ El PID **NO** identifica una aplicación
* ✅ La aplicación se identifica por un **identificador lógico estable**

---

## 3. Identificador Lógico de la Aplicación

El **fichero principal** es la **base del identificador**, complementado con el contexto mínimo necesario.

### Fórmula base (v1)

```
<kind>:<absolute_file_path>:<port?>
```

Donde:

* `kind` → `process`
* `absolute_file_path` → fichero principal ejecutado
* `port` → solo si existe (para permitir múltiples instancias)

### Ejemplos

#### Uvicorn

```bash
uvicorn /home/markus/api/app/main.py --port 8000
```

Identificador:

```
process:/home/markus/api/app/main.py:8000
```

#### Node

```bash
node /home/markus/frontend/server.js
```

Identificador:

```
process:/home/markus/frontend/server.js
```

#### npm run dev

```bash
npm run dev
```

Identificador:

```
process:npm:/home/markus/frontend:dev
```

---

## 4. Modelo de Datos (BBDD)

### 4.1 Tabla `applications`

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY,
    kind TEXT NOT NULL,                 -- process | service
    identifier TEXT NOT NULL UNIQUE,    -- stable logical identifier
    name TEXT NOT NULL,
    file_path TEXT,                     -- main executed file (if exists)
    workdir TEXT NOT NULL,
    port INTEGER,
    pid INTEGER,
    status TEXT NOT NULL,               -- running | stopped
    discovered BOOLEAN NOT NULL DEFAULT true,
    enabled BOOLEAN NOT NULL DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. Flujo de Auto‑descubrimiento

### 5.1 Scanner de Procesos

El scanner debe:

1. Leer procesos del sistema (`ps`)
2. Filtrar procesos válidos:

   * `etimes > N` segundos
   * No procesos del sistema
   * Comandos reconocibles (`uvicorn`, `node`, `npm`, `python`)
3. Extraer:

   * fichero principal
   * directorio de trabajo (cwd)
   * puerto (si existe)
4. Construir el **identificador lógico**

---

### 5.2 Persistencia

Para cada proceso detectado:

* Si **no existe** `identifier` en BBDD → insertar como `discovered`
* Si **existe** → actualizar:

  * `pid`
  * `status = running`
  * `last_seen_at`

Para aplicaciones no vistas en el scan:

* `status = stopped`

⚠️ Nunca se borran automáticamente.

---

## 6. Experiencia de Usuario (UX)

Estados posibles:

* 🟡 Descubierta (`discovered = true`, `enabled = false`)
* 🟢 Activa (`enabled = true`, `status = running`)
* 🔴 Parada (`status = stopped`)

El usuario:

* Ve apps detectadas automáticamente
* Decide cuáles habilitar
* Puede renombrarlas o describirlas

---

## 7. Relación con Logs y Métricas (Futuro Inmediato)

La tabla `applications` será el **nodo central**.

A partir de aquí:

* `application_logs` → rutas de logs por aplicación
* `application_metrics` → métricas asociadas a cada aplicación
* `application_alerts` → reglas de alertas

Nada de esto rompe el diseño actual.

---

## 8. Orden de Implementación Recomendado

1. Crear tabla `applications`
2. Implementar scanner de procesos
3. Persistir apps descubiertas
4. Mostrar apps en frontend
5. Habilitar / deshabilitar apps
6. Asociar logs
7. Asociar métricas
8. Alertas

---

## 9. Principios Clave (para no desviarse)

* El backend decide
* El frontend confirma
* Identificador estable > PID
* No magia, reglas claras
* Pensar en aplicaciones, no en procesos

---

## 10. Resultado Esperado

Un sistema que:

* Detecta automáticamente lo que corre
* No duplica aplicaciones al reiniciar
* Permite crecimiento natural
* Refleja la realidad del servidor
* Es entendible por el usuario

---

Este roadmap define la base sólida del sistema de auto‑descubrimiento de IRANet.
