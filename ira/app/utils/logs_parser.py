from typing import Optional, Tuple, Set
from datetime import datetime
import json
import re


LEVEL_BY_NUMBER = {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal",
}

TEXT_LEVEL_REGEX: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\bTRACE\b", re.I), "trace"),
    (re.compile(r"\bDEBUG\b", re.I), "debug"),
    (re.compile(r"\bINFO\b", re.I), "info"),
    (re.compile(r"\bWARN(ING)?\b", re.I), "warn"),
    (re.compile(r"\bERROR\b", re.I), "error"),
    (re.compile(r"\bFATAL\b", re.I), "fatal"),
]

ANSI_REGEX = re.compile(r"\x1b\[[0-9;]*m")


def normalize_line(line: str) -> str:
    return ANSI_REGEX.sub("", line).strip()


def parse_log_line(
    line: str,
) -> Tuple[str, Optional[str], Optional[datetime], Optional[str]]:
    normalized = normalize_line(line)

    if not normalized:
        return "", None, None, None

    if normalized.startswith("{") and normalized.endswith("}"):
        try:
            payload = json.loads(normalized)

            level = None
            if isinstance(payload.get("level"), int):
                level = LEVEL_BY_NUMBER.get(payload["level"])
            elif isinstance(payload.get("level"), str):
                level = payload["level"].lower()
            elif isinstance(payload.get("level_name"), str):
                level = payload["level_name"].lower()

            ts_value = payload.get("time") or payload.get("timestamp") or payload.get("ts")
            timestamp = None
            if isinstance(ts_value, (int, float)):
                timestamp = datetime.fromtimestamp(ts_value / 1000)
            elif isinstance(ts_value, str):
                try:
                    timestamp = datetime.fromisoformat(ts_value)
                except ValueError:
                    pass

            message = payload.get("msg") or payload.get("message") or normalized
            context = payload.get("name") or payload.get("context")

            return str(message), level, timestamp, context
        except Exception:
            pass

    for regex, level in TEXT_LEVEL_REGEX:
        if regex.search(normalized):
            return normalized, level, None, None

    return normalized, None, None, None


def passes_filters(
    *,
    level: Optional[str],
    message: str,
    allowed_levels: Optional[Set[str]],
    search_term: Optional[str],
) -> bool:
    if allowed_levels is not None:
        if level not in allowed_levels:
            return False

    if search_term:
        if search_term not in message.lower():
            return False

    return True
