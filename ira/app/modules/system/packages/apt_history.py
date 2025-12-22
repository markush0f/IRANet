import gzip
import re
from pathlib import Path
from typing import List

from app.modules.system.packages.types import AptAction, AptHistoryEntry


_HISTORY_PATH = Path("/var/log/apt")

_START_RE = re.compile(r"^Start-Date:\s+(?P<date>.+)$")
_COMMAND_RE = re.compile(r"^Commandline:\s+(?P<cmd>.+)$")
_INSTALL_RE = re.compile(r"^Install:\s+(?P<pkg>.+)$")
_UPGRADE_RE = re.compile(r"^Upgrade:\s+(?P<pkg>.+)$")
_REMOVE_RE = re.compile(r"^Remove:\s+(?P<pkg>.+)$")


_ACTIONS: list[tuple[AptAction, re.Pattern[str]]] = [
    ("install", _INSTALL_RE),
    ("upgrade", _UPGRADE_RE),
    ("remove", _REMOVE_RE),
]


def _read_file(path: Path) -> List[str]:
    if path.suffix == ".gz":
        with gzip.open(path, "rt") as f:
            return f.readlines()

    return path.read_text().splitlines()


def _packages_from_command(command: str) -> List[str]:
    parts = command.split()

    for keyword in ("install", "remove", "upgrade"):
        if keyword in parts:
            idx = parts.index(keyword)
            return [p for p in parts[idx + 1 :] if not p.startswith("-")]

    return []


def read_apt_history(limit: int = 100) -> List[AptHistoryEntry]:
    entries: List[AptHistoryEntry] = []

    files = sorted(
        _HISTORY_PATH.glob("history.log*"),
        reverse=True,
    )

    for file in files:
        lines = _read_file(file)

        current_date: str | None = None
        current_command: str | None = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            start_match = _START_RE.match(line)
            if start_match:
                current_date = start_match.group("date")
                continue

            cmd_match = _COMMAND_RE.match(line)
            if cmd_match:
                current_command = cmd_match.group("cmd")
                continue

            for action, regex in _ACTIONS:
                match = regex.match(line)
                if not match or not current_date or not current_command:
                    continue

                packages = _packages_from_command(current_command)
                
                if not packages:
                    continue
                
                entries.append(
                    {
                        "date": current_date,
                        "action": action,
                        "packages": packages,
                        "command": current_command,
                    }
                )

                if len(entries) >= limit:
                    return entries

    return entries
