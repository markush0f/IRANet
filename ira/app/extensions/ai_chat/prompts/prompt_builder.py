import json

from app.extensions.ai_chat.prompts.prompts import DEFAULT_SYSTEM_PROMPT



def build_prompt(*, user_message: str, tools: dict) -> str:
    tools_json = json.dumps(tools, indent=2)

    return f"""
{DEFAULT_SYSTEM_PROMPT}

Available server tools:
{tools_json}

Server question:
{user_message}

Return ONLY the JSON tool call.
"""
