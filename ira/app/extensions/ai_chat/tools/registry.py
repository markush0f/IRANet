from __future__ import annotations

"""Utilities to declare and collect AI tool definitions from code."""

from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Sequence, Union, get_args, get_origin
from uuid import UUID

import inspect

from app.core.logger import get_logger

# Names reserved for dependency injection; they are never exposed as tool args.
_DEPENDENCY_NAMES = {"session", "repository", "ping_host"}
_logger = get_logger(__name__)


@dataclass(frozen=True)
class ToolSpec:
    """Optional overrides for a tool exposed by a function or method."""
    name: Optional[str] = None
    description: Optional[str] = None
    arguments: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class ToolClassSpec:
    """Class-level export rules for tool generation."""
    name_prefix: Optional[str] = None
    include: Optional[Sequence[str]] = None
    exclude: Optional[Sequence[str]] = None


def tool(
    *,
    name: Optional[str] = None,
    description: Optional[str] = None,
    arguments: Optional[Dict[str, Any]] = None,
) -> Callable:
    """
    Decorate a function/method as a tool with optional overrides.

    If arguments are omitted, they are inferred from the signature and
    basic type annotations.
    """
    def decorator(func: Callable) -> Callable:
        func.__ai_tool__ = ToolSpec(
            name=name,
            description=description,
            arguments=arguments,
        )
        return func

    return decorator


def tool_class(
    *,
    name_prefix: Optional[str] = None,
    include: Optional[Sequence[str]] = None,
    exclude: Optional[Sequence[str]] = None,
) -> Callable:
    """
    Decorate a class so its public methods can be exported as tools.

    The optional include/exclude lists allow fine-grained control over
    which public methods are exported.
    """
    def decorator(cls) -> Any:
        cls.__ai_tool_class__ = ToolClassSpec(
            name_prefix=name_prefix,
            include=include,
            exclude=exclude,
        )
        return cls

    return decorator


def collect_tools_from_package(package_name: str) -> Dict[str, Any]:
    """
    Import modules from a package and collect tools from decorators.

    This walks the package tree, imports each module, and aggregates the
    tool metadata from decorated functions/classes.
    """
    import importlib
    import pkgutil

    tools: Dict[str, Any] = {}
    package = importlib.import_module(package_name)

    _logger.info("Collecting tools from package: %s", package_name)
    for module_info in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        module = importlib.import_module(module_info.name)
        tools.update(collect_tools_from_module(module))

    _logger.info("Collected %s tools from %s", len(tools), package_name)
    return tools


def collect_tools_from_module(module) -> Dict[str, Any]:
    """Collect tool definitions from a single imported module."""
    tools: Dict[str, Any] = {}

    _logger.debug("Scanning module for tools: %s", module.__name__)
    for _, func in inspect.getmembers(module, inspect.isfunction):
        # Only consider functions declared in the target module.
        if func.__module__ != module.__name__:
            continue
        spec = getattr(func, "__ai_tool__", None)
        if not spec:
            continue
        tools[_build_tool_name(func, spec=spec)] = _build_tool_entry(
            func=func,
            handler_path=f"{module.__name__}.{func.__name__}",
            spec=spec,
        )

    for _, cls in inspect.getmembers(module, inspect.isclass):
        # Only consider classes declared in the target module.
        if cls.__module__ != module.__name__:
            continue
        tools.update(_collect_tools_from_class(cls, module_name=module.__name__))

    return tools


def _collect_tools_from_class(cls, *, module_name: str) -> Dict[str, Any]:
    """Collect tool definitions from a class and its public methods."""
    tools: Dict[str, Any] = {}
    class_spec = getattr(cls, "__ai_tool_class__", None)

    if class_spec:
        _logger.debug("Collecting tools from class: %s", cls.__name__)
    members = inspect.getmembers(cls, inspect.isfunction)
    for name, func in members:
        # Export methods when class-level or method-level decorators are present.
        spec = getattr(func, "__ai_tool__", None)
        if not class_spec and not spec:
            continue
        # Skip private/dunder methods.
        if name.startswith("_"):
            continue
        # Apply class-level include/exclude filters.
        if class_spec and class_spec.include and name not in class_spec.include:
            continue
        if class_spec and class_spec.exclude and name in class_spec.exclude:
            continue

        tool_name = _build_method_tool_name(cls, name, class_spec, spec)
        tools[tool_name] = _build_tool_entry(
            func=func,
            handler_path=f"{module_name}.{cls.__name__}.{name}",
            spec=spec,
        )

    return tools


def _build_tool_entry(
    *,
    func: Callable,
    handler_path: str,
    spec: Optional[ToolSpec],
) -> Dict[str, Any]:
    """Build the tool entry payload consumed by the dispatcher."""
    return {
        "description": _build_description(func, spec),
        "handler": handler_path,
        "arguments": _build_arguments(func, spec),
    }


def _build_tool_name(func: Callable, *, spec: ToolSpec) -> str:
    """Resolve tool name for a free function."""
    if spec.name:
        return spec.name
    return func.__name__


def _build_method_tool_name(
    cls,
    method_name: str,
    class_spec: Optional[ToolClassSpec],
    spec: Optional[ToolSpec],
) -> str:
    """Resolve tool name for a class method with prefix support."""
    if spec and spec.name:
        return spec.name
    prefix = None
    if class_spec and class_spec.name_prefix:
        prefix = class_spec.name_prefix
    if not prefix:
        prefix = _default_class_prefix(cls.__name__)
    return f"{prefix}.{method_name}"


def _build_description(func: Callable, spec: Optional[ToolSpec]) -> str:
    """Prefer explicit description, otherwise use the first line of the docstring."""
    if spec and spec.description:
        return spec.description
    doc = inspect.getdoc(func) or ""
    if doc:
        return doc.splitlines()[0].strip()
    return f"Tool call for {func.__name__}."


def _build_arguments(func: Callable, spec: Optional[ToolSpec]) -> Dict[str, Any]:
    """Infer argument schema from signature unless explicitly provided."""
    if spec and spec.arguments is not None:
        return spec.arguments

    signature = inspect.signature(func)
    arguments: Dict[str, Any] = {}

    for name, param in signature.parameters.items():
        # Skip implicit and dependency-injected parameters.
        if name in ("self",):
            continue
        if name in _DEPENDENCY_NAMES:
            continue
        if param.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
            continue

        param_type, optional = _normalize_annotation(param.annotation)
        required = param.default is inspect._empty and not optional
        inferred_type = _infer_type(param_type, param.default)

        arguments[name] = {
            "type": inferred_type,
            "required": required,
        }

    return arguments


def _normalize_annotation(annotation) -> tuple[Any, bool]:
    """Unwrap Optional/Union annotations and flag optionality."""
    if annotation is inspect._empty:
        return Any, False

    origin = get_origin(annotation)
    if origin is None:
        return annotation, False

    if origin is list or origin is dict or origin is tuple or origin is set:
        return origin, False

    if origin is Union:
        args = [arg for arg in get_args(annotation)]
        if type(None) in args:
            non_none = [arg for arg in args if arg is not type(None)]
            return (non_none[0] if non_none else Any), True
        return annotation, False

    return annotation, False


def _infer_type(annotation, default_value) -> str:
    """Infer tool argument type from annotation or default value."""
    if annotation is Any:
        return _infer_type_from_value(default_value) or "any"

    if annotation in (str, Path, UUID, datetime, date):
        return "string"
    if annotation is int:
        return "integer"
    if annotation is bool:
        return "boolean"
    if annotation is float:
        return "number"
    if annotation in (list, tuple, set):
        return "array"
    if annotation is dict:
        return "object"

    return _infer_type_from_value(default_value) or "any"


def _infer_type_from_value(value) -> Optional[str]:
    """Fallback inference based on a default value instance."""
    if value is None or value is inspect._empty:
        return None
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, (list, tuple, set)):
        return "array"
    if isinstance(value, dict):
        return "object"
    return None


def _default_class_prefix(name: str) -> str:
    """Generate a readable prefix from a service class name."""
    for suffix in ("Service", "Orchestrator"):
        if name.endswith(suffix):
            name = name[: -len(suffix)]
            break
    return _to_snake_case(name)


def _to_snake_case(name: str) -> str:
    """Convert CamelCase to snake_case for tool name prefixes."""
    result: list[str] = []
    for index, char in enumerate(name):
        if char.isupper() and index > 0:
            result.append("_")
        result.append(char.lower())
    return "".join(result)
