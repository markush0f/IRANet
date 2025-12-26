# AI Chat Tools Registry (Generacion Automatica)

Este documento describe la automatizacion de tools para la extension de AI Chat, el
formato de registro, el flujo de ejecucion y la inyeccion de dependencias que se
agrego recientemente.

## Objetivo

Se busca evitar el mantenimiento manual de `tools_calls.json`. Ahora el archivo se
genera automaticamente a partir del codigo, usando decoradores en clases y
funciones de `app/services`.

El flujo general es:

1. Decorar clases o funciones con `@tool_class` / `@tool`.
2. Ejecutar el generador `generate_tools_calls.py`.
3. El dispatcher carga `tools_calls.json` al iniciar y ejecuta el handler correcto.

## Archivos principales

- `app/extensions/ai_chat/tools/registry.py`
  - Define los decoradores y la logica de recoleccion.
- `app/extensions/ai_chat/tools/generate_tools_calls.py`
  - Script que genera `app/extensions/ai_chat/tools_calls.json`.
- `app/extensions/ai_chat/core/dispatcher.py`
  - Resuelve handlers, valida argumentos e inyecta dependencias.
- `app/main.py`
  - Ejecuta el generador solo si la extension `ai_chat` esta habilitada.

## Decoradores disponibles

### `@tool`

Se aplica a funciones o metodos individuales. Permite overrides explicitos.

Parametros:

- `name`: nombre del tool (string). Si no se especifica, se usa el nombre de
  la funcion.
- `description`: descripcion del tool. Si no se especifica, se usa la primera
  linea del docstring.
- `arguments`: esquema de argumentos. Si no se especifica, se infiere desde la
  firma.

Ejemplo:

```python
from app.extensions.ai_chat.tools.registry import tool

@tool(
    name="custom.ping",
    description="Hace ping a un host.",
    arguments={"host": {"type": "string", "required": True}},
)
def ping_host(host: str) -> dict:
    ...
```

### `@tool_class`

Se aplica a clases. Exporta metodos publicos como tools de forma automatica.

Parametros:

- `name_prefix`: prefijo para el nombre del tool. Si no se especifica, se
  deriva desde el nombre de la clase (por ejemplo, `SystemService` -> `system`).
- `include`: lista de metodos permitidos. Si se define, solo se exportan esos.
- `exclude`: lista de metodos a excluir.

Ejemplo:

```python
from app.extensions.ai_chat.tools.registry import tool_class

@tool_class(name_prefix="system", exclude=["_helper"])
class SystemService:
    def build_system_snapshot(self) -> dict:
        ...
```

## Como se generan los tools

El script `generate_tools_calls.py` hace lo siguiente:

1. Importa el paquete `app.services`.
2. Recorre todos los modulos usando `pkgutil.walk_packages`.
3. En cada modulo, busca:
   - funciones con `__ai_tool__` (decoradas con `@tool`)
   - clases con `__ai_tool_class__` (decoradas con `@tool_class`)
4. Para cada funcion o metodo:
   - Calcula el nombre final del tool.
   - Genera `description`.
   - Infiera `arguments` desde la firma si no se definieron manualmente.
5. Escribe el JSON en `app/extensions/ai_chat/tools_calls.json`.

El script se ejecuta automaticamente durante el arranque de la aplicacion
solo si la extension `ai_chat` esta habilitada (ver `app/main.py`).

Para ejecutar manualmente:

```
python app/extensions/ai_chat/tools/generate_tools_calls.py
```

## Esquema de tools_calls.json

Cada tool se representa como una entrada en el JSON:

```json
{
  "system.build_system_snapshot": {
    "description": "Snapshot general del sistema.",
    "handler": "app.services.system.system_service.SystemService.build_system_snapshot",
    "arguments": {}
  }
}
```

Campos:

- `description`: texto breve para el LLM.
- `handler`: ruta completa a la funcion o metodo (module.Class.method o module.func).
- `arguments`: esquema compatible con el validador del dispatcher.

## Inferencia de argumentos

Si no se define `arguments` en el decorador, se infiere:

- Se ignoran `self` y parametros reservados para DI.
- Se omiten `*args` y `**kwargs`.
- El tipo se determina por anotaciones o default.

Tipos soportados:

- `string` (str, Path, UUID, datetime, date)
- `integer` (int)
- `number` (float)
- `boolean` (bool)
- `array` (list, tuple, set)
- `object` (dict)
- `any` (fallback)

El parametro `required` es true si no hay default y no es Optional.

## Inyeccion de dependencias en el dispatcher

`ToolDispatcher` resuelve handlers y puede inyectar dependencias basadas en el
nombre de parametros:

- `session` -> `AsyncSessionLocal`
- `repository` -> `MetricPointRepository(session)`
- `ping_host` -> string fijo `"1.1.1.1"`

Cuando un handler o su clase requiere `session` o `repository`, el dispatcher
abre un `AsyncSessionLocal` y lo pasa automaticamente.

El dispatcher soporta handlers sync y async.

## Flujo de ejecucion

1. La app inicia en `app/main.py`.
2. Se consulta si `ai_chat` esta habilitado.
3. Si esta habilitado:
   - Se regeneran las tools.
   - Se monta el router de chat.
4. Cuando el modelo responde con un tool call:
   - `ToolDispatcher` valida argumentos.
   - Resuelve el handler.
   - Inyecta dependencias.
   - Ejecuta y devuelve el resultado.

## Servicios ya decorados

Las clases en `app/services` fueron decoradas con `@tool_class`, con prefijos
especificos:

- `logs`, `processes`, `service_discovery`, `classification`,
  `internet_events`, `internet_metrics`, `metrics`,
  `system`, `system_simple`, `system_packages`,
  `system_alerts`, `applications_system`, `applications`,
  `users`, `extensions`.

Esto permite que los tools se generen automaticamente sin editar el JSON.

## Notas y recomendaciones

- Si un metodo requiere parametros complejos, se recomienda usar `@tool` con
  `arguments` explicito.
- Los tools orientados a websockets (ej. stream de logs) no son compatibles
  con tool calls tradicionales, pero pueden quedarse registrados para otros
  flujos.
- Si agregas un nuevo servicio, solo necesitas decorarlo y regenerar.
- Se puede extender la DI agregando mas nombres en `_DEPENDENCY_NAMES` y
  builders en `ToolDispatcher`.
