import json


def build_prompt(*, user_message: str, tools: dict) -> str:
    return f"""Return a single JSON object.

    Format:
    {{"name": string|null, "arguments": object}}

    Available tools:
    {json.dumps(tools, indent=2)}

    User input:
    {user_message}

    Output (JSON only):
    """
