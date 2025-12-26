import importlib
import inspect
from pathlib import Path
from typing import Any, Dict, cast

from app.extensions.ai_chat.core.argumen_validator import (
    ToolArgumentValidationError,
    validate_arguments,
)
from app.extensions.ai_chat.tools.loader import load_tools_registry
from app.extensions.ai_chat.core.models import ToolCall
from app.core.database import AsyncSessionLocal
from app.repositories.metric_point import MetricPointRepository


class ToolDispatcher:
    """Resolve and execute tool handlers with argument validation and DI."""

    _SESSION_DEPENDENCIES = {"session", "repository"}

    def __init__(self) -> None:
        # Tools registry maps tool names to handler paths and argument schemas.
        TOOLS_REGISTRY_PATH = Path("app/extensions/ai_chat/tools_calls.json")

        self._registry: Dict[str, Any] = load_tools_registry(TOOLS_REGISTRY_PATH)

    async def execute(self, tool_call: ToolCall) -> dict:
        """Validate tool arguments, resolve handler, inject deps, and execute."""
        if tool_call.name is None:
            return {
                "executed": False,
                "reason": "no_tool_selected",
            }

        tool_def = self._registry.get(tool_call.name)

        if tool_def is None:
            return {
                "executed": False,
                "error": f"Tool '{tool_call.name}' is not allowed",
            }

        try:
            tool_def = cast(Dict[str, Any], tool_def)
            arguments_schema = tool_def.get("arguments", {})

            try:
                # Validate against the tool schema before dispatching.
                validated_arguments = validate_arguments(
                    provided=tool_call.arguments,
                    schema=arguments_schema,
                )
            except ToolArgumentValidationError as exc:
                return {
                    "executed": False,
                    "tool": tool_call.name,
                    "error": str(exc),
                }

            handler_path = tool_def["handler"]
            needs_session = self._handler_needs_session(handler_path)

            if needs_session:
                # Create a scoped DB session only when the handler (or its class) needs it.
                async with AsyncSessionLocal() as session:
                    return await self._execute_handler(
                        tool_call=tool_call,
                        handler_path=handler_path,
                        validated_arguments=validated_arguments,
                        session=session,
                    )

            return await self._execute_handler(
                tool_call=tool_call,
                handler_path=handler_path,
                validated_arguments=validated_arguments,
                session=None,
            )

        except Exception as exc:
            return {
                "executed": False,
                "tool": tool_call.name,
                "error": str(exc),
            }

    async def _execute_handler(
        self,
        *,
        tool_call: ToolCall,
        handler_path: str,
        validated_arguments: Dict[str, Any],
        session,
    ) -> dict:
        """Invoke a resolved handler, awaiting if it returns a coroutine."""
        handler = self._resolve_handler(handler_path, session=session)
        call_kwargs = self._build_call_kwargs(
            handler=handler,
            validated_arguments=validated_arguments,
            session=session,
        )

        # Support both sync and async handlers.
        result = handler(**call_kwargs)
        if inspect.isawaitable(result):
            result = await result

        return {
            "executed": True,
            "tool": tool_call.name,
            "result": result,
        }

    def _build_call_kwargs(
        self,
        *,
        handler,
        validated_arguments: Dict[str, Any],
        session,
    ) -> Dict[str, Any]:
        """Merge validated args with dependency-injected kwargs."""
        # User-provided arguments always take precedence.
        call_kwargs = dict(validated_arguments)
        call_kwargs.update(self._build_dependency_kwargs(handler, session=session))
        return call_kwargs

    def _resolve_handler(self, handler_path: str, *, session):
        """Resolve handler path to a callable, instantiating classes as needed."""
        module, attr_parts = self._import_handler_module(handler_path)
        if not attr_parts:
            raise ValueError(f"Invalid handler path: {handler_path}")

        first_attr = getattr(module, attr_parts[0], None)
        if inspect.isclass(first_attr) and len(attr_parts) > 1:
            # If the handler points to a class method, instantiate the class first.
            instance = self._instantiate_service(first_attr, session=session)
            obj = instance
            for part in attr_parts[1:]:
                obj = getattr(obj, part)
            return obj

        obj = module
        for part in attr_parts:
            obj = getattr(obj, part)
        return obj

    def _instantiate_service(self, cls, *, session):
        """Instantiate a service class with dependency-injected __init__ args."""
        init_kwargs = self._build_dependency_kwargs(cls.__init__, session=session)
        return cls(**init_kwargs)

    def _handler_needs_session(self, handler_path: str) -> bool:
        """Check if handler or its class __init__ requires a DB session."""
        module, attr_parts = self._import_handler_module(handler_path)
        if not attr_parts:
            raise ValueError(f"Invalid handler path: {handler_path}")

        first_attr = getattr(module, attr_parts[0], None)
        if inspect.isclass(first_attr) and len(attr_parts) > 1:
            # Check both constructor and method for session-like dependencies.
            if self._signature_needs_session(first_attr.__init__):
                return True
            method = getattr(first_attr, attr_parts[1], None)
            return self._signature_needs_session(method)

        obj = module
        for part in attr_parts:
            obj = getattr(obj, part)
        return self._signature_needs_session(obj)

    def _signature_needs_session(self, callable_obj) -> bool:
        """Return True when callable signature expects a session-like dependency."""
        if callable_obj is None:
            return False
        try:
            signature = inspect.signature(callable_obj)
        except (TypeError, ValueError):
            return False
        # Names are used as a lightweight DI contract.
        return any(name in self._SESSION_DEPENDENCIES for name in signature.parameters)

    def _build_dependency_kwargs(self, callable_obj, *, session) -> Dict[str, Any]:
        """Build kwargs for supported dependencies based on signature names."""
        if callable_obj is None:
            return {}
        try:
            signature = inspect.signature(callable_obj)
        except (TypeError, ValueError):
            return {}

        # Map supported dependency names to builders used for DI.
        dependency_builders = {
            "session": lambda sess: sess,
            "repository": lambda sess: MetricPointRepository(sess),
            "ping_host": lambda _sess: "1.1.1.1",
        }

        kwargs: Dict[str, Any] = {}
        for name, param in signature.parameters.items():
            if name == "self":
                continue
            if name not in dependency_builders:
                continue
            if name in self._SESSION_DEPENDENCIES and session is None:
                raise RuntimeError("Session dependency is required but missing")
            kwargs[name] = dependency_builders[name](session)

        return kwargs

    def _import_handler_module(self, handler_path: str):
        """Find the longest importable module path inside the handler string."""
        parts = handler_path.split(".")
        for i in range(len(parts), 0, -1):
            module_path = ".".join(parts[:i])
            try:
                module = importlib.import_module(module_path)
            except ModuleNotFoundError:
                continue
            # Return module plus remaining attribute chain (class.method or function).
            return module, parts[i:]
        raise ModuleNotFoundError(
            f"Cannot import handler module for path: {handler_path}"
        )
