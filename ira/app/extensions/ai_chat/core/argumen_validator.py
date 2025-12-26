from typing import Any, Dict


class ToolArgumentValidationError(Exception):
    pass


def validate_arguments(
    *,
    provided: Dict[str, Any],
    schema: Dict[str, Any],
) -> Dict[str, Any]:
    validated: Dict[str, Any] = {}

    # Reject unknown arguments
    for key in provided:
        if key not in schema:
            raise ToolArgumentValidationError(
                f"Unexpected argument '{key}'"
            )

    for name, rules in schema.items():
        is_required = rules.get("required", False)

        if name not in provided:
            if is_required:
                raise ToolArgumentValidationError(
                    f"Missing required argument '{name}'"
                )
            continue

        value = provided[name]
        expected_type = rules.get("type")

        if expected_type in (None, "any"):
            validated[name] = value
            continue

        if expected_type == "string":
            if not isinstance(value, str):
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be a string"
                )

        elif expected_type == "integer":
            if not isinstance(value, int):
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be an integer"
                )

            min_value = rules.get("min")
            max_value = rules.get("max")

            if min_value is not None and value < min_value:
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be >= {min_value}"
                )

            if max_value is not None and value > max_value:
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be <= {max_value}"
                )

        elif expected_type == "boolean":
            if not isinstance(value, bool):
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be a boolean"
                )

        elif expected_type == "number":
            if not isinstance(value, (int, float)):
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be a number"
                )

            min_value = rules.get("min")
            max_value = rules.get("max")

            if min_value is not None and value < min_value:
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be >= {min_value}"
                )

            if max_value is not None and value > max_value:
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be <= {max_value}"
                )

        elif expected_type == "array":
            if not isinstance(value, list):
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be an array"
                )

        elif expected_type == "object":
            if not isinstance(value, dict):
                raise ToolArgumentValidationError(
                    f"Argument '{name}' must be an object"
                )

        else:
            raise ToolArgumentValidationError(
                f"Unsupported argument type '{expected_type}'"
            )

        validated[name] = value

    return validated
