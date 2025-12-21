# 📡 Información de Internet a recopilar (Backend IraNET)

Usa esta checklist para ir implementando y validando cada parte del backend de métricas de red.

---

## 1️⃣ Latencia (Ping)

**Qué mide:** tiempo de respuesta real de la red
**Por qué es clave:** experiencia de usuario, juegos, APIs, tiempo real

**Recopilar:**

* [x] `net.latency.avg_ms`
* [x] `net.latency.min_ms`
* [x] `net.latency.max_ms`

**Tipo:** gauge
**Intervalo recomendado:** 5 segundos
**Uso en gráficas:** 📈 línea

---

## 2️⃣ Jitter

**Qué mide:** variación del ping
**Por qué es clave:** estabilidad real (más importante que el ping medio)

**Recopilar:**

* [x] `net.jitter.ms`

**Tipo:** gauge
**Intervalo:** 5 segundos
**Uso en gráficas:** 📈 línea / área

---

## 3️⃣ Pérdida de paquetes (Packet Loss)

**Qué mide:** paquetes que no llegan
**Por qué es clave:** microcortes, VoIP, streaming

**Recopilar:**

* [ ] `net.packet_loss.percent`

**Tipo:** gauge
**Intervalo:** 5 segundos
**Uso en gráficas:** 📉 línea con umbrales

---

## 4️⃣ Tráfico de red por interfaz (RAW)

**Qué mide:** uso real de la red
**Por qué es clave:** consumo, saturación, análisis histórico

**Recopilar por cada interfaz:**

* [ ] `net.<interface>.rx.bytes`
* [ ] `net.<interface>.tx.bytes`

**Ejemplo:**

* [ ] `net.eth0.rx.bytes`
* [ ] `net.eth0.tx.bytes`

**Tipo:** counter
**Intervalo:** 5 segundos

**Uso en gráficas:**

* [ ] Bytes acumulados
* [ ] Velocidad derivada (bytes/s, Mbps)

---

## 5️⃣ Velocidad derivada (NO se guarda directamente)

**Qué es:** cálculo a partir de bytes
**Por qué NO se guarda:** se deriva del histórico

**Derivado de:**

```
(current_bytes - previous_bytes) / delta_time
```

**Resultado:**

* [ ] RX bytes/s
* [ ] TX bytes/s
* [ ] RX Mbps
* [ ] TX Mbps

**Cálculo en:**

* [ ] Backend (recomendado a largo plazo)
* [ ] Frontend (MVP)

---

## 6️⃣ Metadata mínima (no métrica)

> Esto **NO va a métricas**, pero es necesaria para contexto y consultas.

* [ ] `host` (nombre del nodo)
* [ ] `interface_name`
* [ ] `timestamp` (UTC)

---

## ✅ Estado general

* [ ] Collector implementado
* [ ] Métricas persistidas en histórico
* [ ] Endpoint de series funcionando
* [ ] Datos listos para gráficas
