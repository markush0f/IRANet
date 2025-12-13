# Comando `top` en Linux — Guía exhaustiva

`top` es una herramienta interactiva de monitorización en tiempo real que permite observar el estado del sistema y de los procesos. Este documento describe **todo lo que puede verse con `top`**, de forma **técnica, detallada y orientada a administración de sistemas**.

---

## 1. Cabecera completa del sistema

La cabecera ocupa varias líneas y resume el estado global del sistema.

---

### 1.1 Primera línea — Estado general

Ejemplo:

```
top - 18:42:10 up 12 days,  3:21,  2 users,  load average: 0.35, 0.40, 0.38
```

| Campo                   | Descripción técnica                               |
| ----------------------- | ------------------------------------------------- |
| Hora                    | Hora actual del sistema                           |
| `up`                    | Tiempo desde el último arranque                   |
| `users`                 | Sesiones activas                                  |
| `load average (1,5,15)` | Media de procesos en cola de ejecución o I/O wait |

**Interpretación del load average**:

* `< nº CPUs`: sistema holgado
* `≈ nº CPUs`: sistema al límite
* `> nº CPUs`: sobrecarga

---

### 1.2 Segunda línea — Tareas / procesos

Ejemplo:

```
Tasks: 212 total, 1 running, 211 sleeping, 0 stopped, 0 zombie
```

| Campo    | Significado            |
| -------- | ---------------------- |
| total    | Procesos existentes    |
| running  | En ejecución (R)       |
| sleeping | En espera (S / D)      |
| stopped  | Detenidos (T)          |
| zombie   | Procesos huérfanos (Z) |

---

### 1.3 Tercera línea — Uso de CPU

Ejemplo:

```
%Cpu(s):  3.5 us,  1.2 sy,  0.0 ni, 94.5 id,  0.6 wa,  0.0 hi,  0.2 si,  0.0 st
```

| Campo | Descripción                  |
| ----- | ---------------------------- |
| us    | Tiempo en espacio de usuario |
| sy    | Tiempo en kernel             |
| ni    | Procesos con nice modificado |
| id    | CPU inactiva                 |
| wa    | Espera por I/O               |
| hi    | Interrupciones hardware      |
| si    | Interrupciones software      |
| st    | Tiempo robado por hipervisor |

---

### 1.4 Cuarta línea — Memoria RAM

Ejemplo:

```
MiB Mem : 15934.2 total,  2431.1 free,  9212.4 used,  4290.7 buff/cache
```

| Campo      | Detalle                    |
| ---------- | -------------------------- |
| total      | RAM instalada              |
| free       | RAM sin uso                |
| used       | RAM usada por procesos     |
| buff/cache | Caché del kernel y buffers |

---

### 1.5 Quinta línea — Swap

Ejemplo:

```
MiB Swap:  2048.0 total,  2048.0 free,     0.0 used.  5987.3 avail Mem
```

| Campo     | Descripción                  |
| --------- | ---------------------------- |
| total     | Swap configurada             |
| free      | Swap libre                   |
| used      | Swap usada                   |
| avail Mem | Memoria realmente disponible |

---

## 2. Tabla de procesos (campo por campo)

Ejemplo de columnas:

```
PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND
```

| Campo   | Significado técnico       |
| ------- | ------------------------- |
| PID     | Identificador del proceso |
| USER    | Usuario propietario       |
| PR      | Prioridad del kernel      |
| NI      | Nice value                |
| VIRT    | Memoria virtual total     |
| RES     | Memoria residente         |
| SHR     | Memoria compartida        |
| S       | Estado del proceso        |
| %CPU    | Uso de CPU                |
| %MEM    | Uso de RAM                |
| TIME+   | CPU acumulada             |
| COMMAND | Comando ejecutado         |

---

## 3. Estados de procesos

| Código | Estado                      |
| ------ | --------------------------- |
| R      | Running                     |
| S      | Sleeping                    |
| D      | Uninterruptible sleep (I/O) |
| T      | Stopped                     |
| Z      | Zombie                      |
| I      | Idle kernel thread          |

---

## 4. Teclas interactivas y modos avanzados

### 4.1 Teclas generales

| Tecla | Acción                  |
| ----- | ----------------------- |
| q     | Salir                   |
| h / ? | Ayuda                   |
| k     | Matar proceso           |
| r     | Renice                  |
| c     | Toggle comando completo |
| t     | CPU summary             |
| m     | Memoria summary         |

---

### 4.2 Modos avanzados

| Modo              | Tecla | Descripción        |
| ----------------- | ----- | ------------------ |
| Vista por CPU     | 1     | CPU por core       |
| Modo acumulativo  | S     | Tiempo acumulado   |
| Árbol de procesos | V     | Jerarquía          |
| Mostrar threads   | H     | Hilos              |
| Delay             | d     | Intervalo refresco |

---

## 5. Ordenamientos, filtros y vistas

### 5.1 Ordenar

| Tecla | Orden   |
| ----- | ------- |
| P     | CPU     |
| M     | Memoria |
| T     | Tiempo  |
| N     | PID     |

### 5.2 Filtros

| Tecla | Función           |
| ----- | ----------------- |
| u     | Usuario           |
| o / O | Filtros por campo |
| i     | Ignorar idle      |
| n     | Limitar procesos  |

---

## 6. Diferencias entre `top` y variantes

| Herramienta | Diferencia clave            |
| ----------- | --------------------------- |
| top         | Clásico, universal          |
| htop        | Interfaz ncurses avanzada   |
| atop        | Histórico y contabilidad    |
| btop        | Gráficos modernos           |
| glances     | Monitorización centralizada |

---

## 7. Casos prácticos de uso

* Detectar fugas de memoria
* Identificar cuellos de botella CPU
* Diagnosticar I/O wait
* Análisis de procesos zombies
* Debugging en servidores productivos

---

## 8. Conclusión

`top` es una herramienta esencial para **administradores de sistemas y debugging de rendimiento**, ofreciendo visibilidad inmediata del estado del sistema y los procesos.
