# Checklist incremental para implementar un `top` programático en Linux

Esta checklist está pensada para evolucionar tu script actual **por fases**, priorizando **impacto real, bajo coste de implementación y coherencia con `top` clásico**.

---

## Fase 0 – Base mínima (ya implementada)

* [x] Leer procesos desde `/proc`
* [x] Filtrar PIDs válidos
* [x] Nombre del proceso (`comm`)
* [x] CPU real basada en delta temporal
* [x] RSS (memoria residente)
* [x] Ordenar por `%CPU`

---

## Fase 1 – Tabla de procesos esencial (PRIORIDAD ALTA)

Campos básicos que cualquier administrador espera ver.

* [x] `USER` → propietario del proceso (`stat().st_uid`)
* [x] `STAT` → estado del proceso (`/proc/<pid>/stat` campo 3)
* [x] `TIME+` → tiempo total de CPU consumido
* [x] `PPID` → padre del proceso
* [x] `NI` → nice value
* [x] `PRI` → prioridad de scheduling

Resultado: tabla de procesos ya comparable con `top` real.

---

## Fase 2 – Memoria avanzada (PRIORIDAD ALTA)

Mejora clave para análisis de consumo real.

* [ ] `VIRT` → memoria virtual total (`statm`)
* [ ] `SHR` → memoria compartida
* [ ] `%MEM` → porcentaje sobre RAM total
* [ ] Lectura de RAM total (`/proc/meminfo`)

Resultado: visibilidad real del impacto en memoria.

---

## Fase 3 – Cabecera del sistema (PRIORIDAD MEDIA)

Información global del sistema.

* [ ] Uptime (`/proc/uptime`)
* [ ] Load average 1m / 5m / 15m (`/proc/loadavg`)
* [ ] Número de tareas (running / total)
* [ ] CPU global (`%us`, `%sy`, `%id`, `%wa`, etc.)

Resultado: cabecera equivalente a `top`.

---

## Fase 4 – Memoria y swap global (PRIORIDAD MEDIA)

Análisis de presión de memoria.

* [ ] `MemTotal`
* [ ] `MemFree`
* [ ] `MemAvailable`
* [ ] `Buffers`
* [ ] `Cached`
* [ ] `SwapTotal`
* [ ] `SwapFree`

Resultado: diagnóstico rápido de problemas de RAM / swap.

---

## Fase 5 – Concurrencia y threads (PRIORIDAD MEDIA)

Clave para entender procesos pesados.

* [ ] Número de threads (`Threads` en `/proc/<pid>/status`)
* [ ] Identificador de sesión
* [ ] Grupo de procesos (PGRP)

Resultado: análisis fino de aplicaciones multithread.

---

## Fase 6 – I/O por proceso (PRIORIDAD MEDIA–ALTA)

Muy útil para debugging de disco.

* [ ] Bytes leídos (`read_bytes`)
* [ ] Bytes escritos (`write_bytes`)
* [ ] Syscalls de lectura/escritura
* [ ] Delta de I/O (similar al CPU delta)

Resultado: detectar procesos que saturan disco.

---

## Fase 7 – Ordenación y filtros (PRIORIDAD ALTA)

Hace el monitor usable.

* [ ] Ordenar por CPU / MEM / TIME / I/O
* [ ] Filtrar por usuario
* [ ] Filtrar por nombre de proceso
* [ ] Limitar número de procesos mostrados

Resultado: herramienta práctica de administración.

---

## Fase 8 – Árbol de procesos (PRIORIDAD BAJA)

Visión estructural del sistema.

* [ ] Relación padre-hijo (`PPID`)
* [ ] Construir árbol tipo `pstree`

Resultado: comprensión de jerarquías de procesos.

---

## Fase 9 – Información avanzada (OPCIONAL)

No esencial, pero potente.

* [ ] I/O de red por proceso
* [ ] Ficheros abiertos
* [ ] Cgroups
* [ ] Límites del proceso
* [ ] NUMA node

---

## Fase 10 – Interfaz / Exportación

Según objetivo final.

* [ ] Loop tipo `top`
* [ ] Exportar JSON
* [ ] Exponer métricas (Prometheus)
* [ ] Convertir en daemon
* [ ] Librería reusable

---

## Orden recomendado de implementación

1. Fase 1 – Tabla esencial
2. Fase 2 – Memoria avanzada
3. Fase 7 – Ordenación y filtros
4. Fase 3 – Cabecera del sistema
5. Fase 6 – I/O
6. Resto según necesidad

---

👉 Con las fases 1 + 2 + 3 completas, tu script ya es un **`top` sin interfaz**, ideal para APIs, agentes o monitoring.
