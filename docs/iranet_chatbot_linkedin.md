# IRANet Chatbot — Overview for LinkedIn

Este documento resume lo que hace el chatbot de IRANet y los cambios recientes para
comunicarlo en LinkedIn.

## Que es

El chatbot de IRANet es un asistente de monitoreo que conecta lenguaje natural con
servicios internos del sistema (CPU, memoria, procesos, logs, discos, red, etc.).
Su objetivo es traducir preguntas en acciones estructuradas y devolver respuestas
reales basadas en datos del servidor.

## Principales capacidades

- **Ejecucion de tools**: convierte preguntas en llamadas a funciones reales del backend.
- **Monitoreo del sistema**: CPU, memoria, procesos, discos, carga, alertas.
- **Logs y aplicaciones**: exploracion de logs y detalles de aplicaciones detectadas.
- **Red/Internet**: metricas de red (latencia, jitter, trafico, packet loss).
- **Persistencia de chats**: guarda conversaciones y mensajes en base de datos.
- **Historico y auditoria**: todas las respuestas quedan registradas.

## Arquitectura (alto nivel)

1. El usuario pregunta en lenguaje natural.
2. El modelo genera un JSON con el tool a ejecutar.
3. El dispatcher valida argumentos, inyecta dependencias y ejecuta el handler.
4. Se retorna el resultado estructurado al usuario.

## Registro automatico de tools

Las tools se generan automaticamente a partir del codigo usando decoradores:

- `@tool` para funciones/metodos individuales.
- `@tool_class` para exportar clases completas.

Un generador recorre `app/services` y crea `tools_calls.json` en el arranque
cuando la extension esta habilitada.

## Persistencia de chats

Se agregaron tablas y endpoints para:

- Crear un chat.
- Guardar cada pregunta del usuario.
- Guardar cada respuesta del bot.
- Listar chats y cargar mensajes (paginados).

## Respuestas en Markdown + JSON

Las respuestas del bot se guardan en dos formatos:

- **JSON** (para auditoria y trazabilidad).
- **Markdown** (para visualizacion directa en frontend).

En el frontend, los mensajes del bot se envian como Markdown para una mejor
experiencia de lectura.

## Endpoints principales

- `POST /chat/create`: crea un chat nuevo.
- `POST /chat/ask`: guarda la pregunta y responde con tools.
- `GET /chat/`: lista chats.
- `GET /chat/{chat_id}`: carga chat y mensajes (paginado).
- `PUT /chat/{chat_id}`: edita titulo del chat.
- `DELETE /chat/{chat_id}`: elimina chat y mensajes.

## Integracion con extensiones

El chatbot forma parte de un sistema de extensiones:

- Habilitar una extension instala dependencias y migraciones.
- Deshabilitar desinstala recursos.

Esto permite activar el chatbot solo cuando es necesario.

## Resumen corto (para post)

Estoy trabajando en el chatbot de IRANet: un asistente de monitoreo que transforma
preguntas en ejecucion real de herramientas del sistema, guarda cada conversacion,
y entrega respuestas en Markdown para el frontend mientras conserva el JSON completo
para auditoria. Todo el registro de tools es automatico y se genera desde el codigo.
