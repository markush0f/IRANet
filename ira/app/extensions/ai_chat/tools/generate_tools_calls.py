"""Generate tools_calls.json from decorated services."""

import json
from pathlib import Path

from app.core.logger import get_logger
from app.extensions.ai_chat.tools.registry import collect_tools_from_package


logger = get_logger(__name__)


def main() -> None:
    # Collect tool metadata from all modules under app.services.
    logger.info("Generating tools_calls.json from app.services")
    tools = collect_tools_from_package("app.services")
    output_path = Path("app/extensions/ai_chat/tools_calls.json")
    # Emit a stable, readable JSON file for inspection and review.
    output_path.write_text(
        json.dumps(tools, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    logger.info("Wrote %s tools to %s", len(tools), output_path)


if __name__ == "__main__":
    main()
