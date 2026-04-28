# Persistencia Multi-Servidor

Este documento describe como adaptar IRA para soportar persistencia basada en multiples servidores, en lugar de asumir que todos los datos provienen de un unico host.

No propone cambios de codigo directos. La idea es dejar clara la arquitectura objetivo, los cambios de modelo necesarios, los riesgos y un plan de migracion por fases.

## Resumen Ejecutivo

La recomendacion es adoptar un modelo de:

- un agente IRA ejecutandose en cada servidor
- una base de datos PostgreSQL central compartida
- una identidad estable de servidor (`server_id`)
- persistencia segmentada por servidor

Esto permite que cada nodo recoja sus propios procesos, metricas y alertas, mientras la plataforma central consulta todo desde una sola base de datos.

La clave es no intentar que un solo proceso IRA "vea" o mida todos los servidores de forma local. Cada servidor debe seguir siendo responsable de su propio discovery, runtime y lectura del filesystem.

## Problema Actual

El backend actual esta preparado para un unico host. Hay varios supuestos de single-server repartidos por el sistema.

### 1. Las aplicaciones son globales

En `docker/init.sql` la tabla `applications` define:

- `identifier TEXT NOT NULL UNIQUE`

Y en `app/services/applications/applications.py` el identificador se construye como:

```python
process:{workdir}
```

Eso funciona en un solo servidor, pero rompe cuando dos nodos tienen el mismo `workdir` o una estructura de despliegue parecida.

Ejemplo:

- servidor A: `process:/srv/app`
- servidor B: `process:/srv/app`

Ambas aplicaciones colisionan aunque sean procesos de maquinas distintas.

### 2. Los schedulers asumen que todo vive en el host local

En `app/core/application_metrics_scheduler.py` se cargan todas las aplicaciones habilitadas desde la base de datos y se intentan medir localmente.

Con varios nodos compartiendo la misma BD, eso produciria este problema:

- el nodo A leeria aplicaciones del nodo B
- intentaria inspeccionar procesos que no existen localmente
- actualizaria estados erraticos o inconsistentes

### 3. La identidad de host no es una clave fuerte

En `app/core/metrics_scheduler.py` se usa `socket.gethostname()`.

Eso sirve como dato visible, pero no como identidad de negocio confiable. En contenedores, despliegues efimeros o clonados, el hostname puede:

- cambiar
- repetirse
- no ser suficientemente estable

### 4. Las consultas no estan scopeadas por servidor

Los repositorios y APIs principales listan o consultan datos sin filtrar por servidor:

- aplicaciones
- alertas
- series de metricas
- eventos de packet loss

Con una BD compartida, eso mezcla datos de nodos distintos salvo que se agregue un ambito explicito.

## Arquitectura Recomendada

La arquitectura recomendada es:

1. Un proceso IRA por servidor.
2. Todos los procesos IRA escriben en la misma PostgreSQL central.
3. Cada instancia IRA tiene un `server_id` fijo y estable.
4. Cada fila persistida queda asociada al servidor que la genero.
5. La capa de lectura puede consultar por servidor o de forma agregada.

### Modelo mental

```text
Servidor A ----\
                \
Servidor B ------> PostgreSQL central <----- Backend/UI
                /
Servidor C ----/
```

Cada nodo:

- descubre sus procesos locales
- recolecta sus metricas de sistema
- mide sus aplicaciones locales
- persiste sus alertas

La plataforma central:

- lista servidores
- agrupa o filtra por `server_id`
- muestra historicos y estados consolidados

## Decision Principal

La entidad central que falta hoy es `server_id`.

La propuesta no es usar `hostname` como clave primaria de negocio, sino introducir una identidad explicita configurada por despliegue.

Ejemplo:

- `IRA_SERVER_ID=prod-eu-1`
- `IRA_SERVER_ID=prod-eu-2`
- `IRA_SERVER_ID=lab-node-01`

`hostname` puede seguir guardandose para mostrar en UI o para diagnostico, pero no debe ser la pieza principal de particionado logico.

## Cambios de Modelo Recomendados

## 1. Nueva tabla `servers`

Se recomienda introducir una tabla `servers` para registrar los nodos conocidos.

Campos sugeridos:

- `id TEXT PRIMARY KEY`
- `hostname TEXT NOT NULL`
- `display_name TEXT`
- `status TEXT NOT NULL`
- `last_seen_at TIMESTAMPTZ`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `metadata JSONB` opcional para IP, version, entorno, SO, etc.

Objetivo:

- identificar nodos de manera estable
- permitir heartbeats
- facilitar listados de servidores desde la plataforma

## 2. Tabla `applications`

Anadir:

- `server_id TEXT NOT NULL`

Y cambiar la unicidad de:

- `UNIQUE(identifier)`

a:

- `UNIQUE(server_id, identifier)`

Esto resuelve el conflicto de aplicaciones iguales en servidores distintos.

### Resultado esperado

La misma aplicacion logica puede existir en dos servidores sin colision:

- `server_id=prod-a`, `identifier=process:/srv/api`
- `server_id=prod-b`, `identifier=process:/srv/api`

## 3. Tabla `metrics_points`

Anadir:

- `server_id TEXT NOT NULL`

Mantener `host` como dato informativo si sigue siendo util para visualizacion.

Indices sugeridos:

- `(server_id, metric, ts)`
- `(server_id, ts)`

Motivo:

- las metricas del sistema deben consultarse por servidor
- el frontend o la API no deberian depender solo del nombre de host

## 4. Tabla `system_alerts`

Anadir:

- `server_id TEXT NOT NULL`

Mantener `host` como texto visible si interesa.

Indices sugeridos:

- `(server_id, last_seen_at)`
- `(server_id, metric, status)` opcional

Motivo:

- las alertas deben pertenecer a un nodo concreto
- la paginacion necesita opcion de filtro por servidor

## 5. Tabla `application_metrics`

En una primera fase hay dos opciones validas.

### Opcion A: no anadir `server_id` todavia

Ventajas:

- cambio minimo
- el `application_id` ya apunta a una aplicacion que pertenece a un unico servidor

Coste:

- algunas consultas agregadas dependen de joins con `applications`

### Opcion B: anadir `server_id`

Ventajas:

- consultas y particionado mas directos
- mejor base para escalado futuro

Coste:

- mas cambios de esquema y mas redundancia controlada

### Recomendacion

Para un MVP, la opcion A es suficiente. Si el volumen de metricas de aplicaciones va a crecer mucho, la opcion B puede compensar.

## 6. Tabla `application_log_paths`

No es obligatorio anadir `server_id` si cada log path depende de `application_id` y cada aplicacion ya queda atada a un servidor.

Para un MVP se puede dejar asi.

## Comportamiento Esperado por Componente

## 1. Registro del servidor

Cada instancia IRA, al arrancar, deberia:

1. leer `IRA_SERVER_ID`
2. registrar o actualizar su fila en `servers`
3. guardar `hostname` actual y metadatos utiles
4. refrescar `last_seen_at`

Esto se puede hacer como un `upsert` en startup y luego actualizar `last_seen_at` periodicamente.

## 2. Scheduler de metricas de sistema

El scheduler de `app/core/metrics_scheduler.py` debe:

- recolectar metricas del host local
- persistirlas con el `server_id` local
- persistir alertas con el `server_id` local

No debe escribir datos sin ese scoping.

## 3. Scheduler de metricas de aplicaciones

Este es el punto mas sensible.

`app/core/application_metrics_scheduler.py` debe filtrar solo aplicaciones del servidor local.

Es decir, conceptualmente deberia comportarse como:

- `Application.enabled == True`
- `Application.server_id == current_server_id`

Sin eso, cada nodo intentaria inspeccionar procesos que en realidad viven en otro servidor.

## 4. Services y repositorios

Los repositorios que hoy trabajan de forma global deberian aceptar `server_id` en sus operaciones importantes.

Ejemplos:

- `ApplicationRepository.get_by_identifier(identifier, server_id)`
- `ApplicationRepository.list_all(server_id=None)`
- `MetricPointRepository.list_series(metric, server_id, ts_from, ts_to)`
- `SystemAlertRepository.get_system_alerts(server_id=None, limit, offset)`

La regla general es simple:

- si el dato nace en un nodo, debe poder filtrarse por `server_id`

## 5. APIs

Las APIs de lectura deberian soportar filtros por servidor.

Casos claros:

- `/applications/all/list/`
- `/alerts`
- `/metrics/series`
- `/internet/packet-loss/events`

Se recomienda filtrar por `server_id`, no por `host`.

`host` puede seguir apareciendo en respuestas, pero como informacion complementaria.

## Operaciones Locales vs Operaciones Centralizadas

Es importante separar dos tipos de funcionalidad.

## A. Funcionalidad centralizable por base de datos

Estas piezas encajan bien en una BD central compartida:

- inventario de aplicaciones registradas
- metricas historicas del sistema
- metricas historicas de aplicaciones
- alertas
- estado de heartbeat del servidor

## B. Funcionalidad que sigue siendo local al host

Estas piezas no se resuelven solo con persistencia central:

- discovery de procesos vivos
- runtime en tiempo real de un proceso
- lectura de logs desde el filesystem local
- inspeccion de puertos y servicios del host

Motivo:

- dependen del sistema operativo local
- leen `/proc`, procesos, sockets o ficheros del nodo concreto

### Implicacion arquitectonica

Aunque la persistencia sea central, estas operaciones deben seguir ejecutandose en el agente del servidor propietario.

Eso deja dos caminos posibles para una fase posterior:

1. que cada nodo exponga API local y el backend central haga proxy
2. que ciertas vistas se limiten a datos persistidos y no hagan inspeccion remota en vivo

## Riesgos de Implementacion

## 1. Colisiones de datos legacy

Si ya existen aplicaciones en la BD, al introducir `server_id` hay que decidir a que nodo pertenecen.

Si todos los datos actuales vienen de un unico entorno, el backfill es sencillo.

Si no, puede haber ambiguedades.

## 2. `hostname` no siempre es estable

Si alguien intenta usar `hostname` como sustituto de `server_id`, volveran a aparecer problemas en entornos con contenedores o clonados.

## 3. Varias instancias sin `IRA_SERVER_ID`

Si el despliegue no obliga a definir `IRA_SERVER_ID`, distintas instancias podrian arrancar con comportamiento no determinista o compartir una identidad erronea.

## 4. Endpoints que hoy parecen globales

Algunas rutas actuales parecen "globales" por diseno, pero en realidad miden el host local.

Ejemplos:

- discovery de aplicaciones
- runtime snapshots en vivo
- lectura de logs

Si se presenta eso en una UI multi-servidor sin aclararlo, el usuario puede interpretar mal los datos.

## 5. Frontend acoplado a `host`

Si el frontend usa `host` como clave principal de filtrado o agrupacion, habra que mover esa logica a `server_id`.

## Plan de Migracion Recomendado

## Fase 1. Identidad de servidor

Objetivo:

- introducir `IRA_SERVER_ID`
- crear tabla `servers`
- registrar nodos y heartbeat

Resultado:

- la plataforma ya conoce que servidores existen

## Fase 2. Scopeo de persistencia principal

Objetivo:

- anadir `server_id` a `applications`, `metrics_points` y `system_alerts`
- cambiar la unicidad de `applications`
- actualizar indices

Resultado:

- ya no hay mezcla estructural de datos entre servidores

## Fase 3. Schedulers seguros

Objetivo:

- hacer que cada scheduler opere solo sobre su propio `server_id`

Resultado:

- cada nodo mide solo lo suyo
- desaparecen intentos de inspeccion cruzada

## Fase 4. Repositorios y APIs con filtro

Objetivo:

- anadir filtros opcionales por `server_id`
- exponer listados de servidores y consultas agregadas

Resultado:

- el backend y la UI pueden navegar por servidor de forma limpia

## Fase 5. Operaciones remotas en vivo

Objetivo:

- resolver discovery remoto
- resolver runtime remoto
- resolver lectura remota de logs

Resultado:

- experiencia multi-servidor completa, no solo historica

## Estrategia de Backfill de Datos

Si la BD actual contiene solo datos de un servidor, la migracion puede hacerse asi:

1. crear la tabla `servers`
2. crear el servidor legacy en `servers`
3. anadir `server_id` nullable a las tablas necesarias
4. rellenar todas las filas existentes con ese `server_id`
5. crear indices nuevos
6. cambiar `server_id` a `NOT NULL`
7. reemplazar restricciones unicas antiguas

Si la BD contiene datos mezclados de varios nodos sin un marcador claro, el backfill requerira reglas adicionales y revisiones manuales.

## Recomendaciones de Diseno

## 1. `server_id` debe ser explicito

No generarlo a partir de `hostname` en runtime si quieres una identidad durable.

## 2. Mantener `host` como dato de presentacion

Es util para dashboards y alertas, pero no deberia ser la particion principal.

## 3. Preferir cambios pequenos y estructurales

El mayor beneficio viene de:

- `server_id`
- unicidad compuesta en `applications`
- schedulers filtrados por servidor

No hace falta redisenar todo el sistema de golpe.

## 4. No intentar resolver runtime remoto en la misma fase

Persistencia multi-servidor y operacion remota en vivo son problemas relacionados, pero no iguales.

Es mejor cerrar primero la base de datos multi-servidor y luego resolver proxy remoto o agentes expuestos por HTTP.

## Archivos del Estado Actual que Quedan Afectados

Los principales puntos del repo impactados por esta decision son:

- `docker/init.sql`
- `app/core/config.py`
- `app/core/metrics_scheduler.py`
- `app/core/application_metrics_scheduler.py`
- `app/models/entities/application.py`
- `app/models/entities/metric_point.py`
- `app/models/entities/system_alert.py`
- `app/repositories/applications.py`
- `app/repositories/metric_point.py`
- `app/repositories/system_alerts.py`
- `app/services/applications/applications.py`
- `app/services/applications/applications_metrics.py`
- `app/services/metrics/metrics_service.py`
- `app/services/system/system_alerts_service.py`
- `app/api/applications.py`
- `app/api/applications_metrics.py`
- `app/api/metrics.py`
- `app/api/internet.py`
- `app/api/system_alerts.py`

Tambien habria que introducir nuevos elementos, por ejemplo:

- entidad `Server`
- repositorio de `servers`
- endpoint `/servers`
- migraciones SQL nuevas

## Conclusiones

Para soportar multi-servidor de forma correcta, IRA necesita dejar de asumir que:

- hay una sola maquina origen
- `hostname` es suficiente como identidad
- las aplicaciones son globales
- cualquier instancia puede recolectar cualquier proceso

La solucion recomendada es evolucionar a un modelo de agentes por servidor con una base central compartida y un `server_id` explicito.

El cambio minimo con mas impacto es:

1. introducir `server_id`
2. scopear `applications`, `metrics_points` y `system_alerts`
3. limitar los schedulers al servidor local
4. exponer consultas filtradas por `server_id`

Con eso queda resuelta la base de la persistencia multi-servidor. La parte de operaciones remotas en vivo puede tratarse en una segunda fase, ya sobre una base consistente.
