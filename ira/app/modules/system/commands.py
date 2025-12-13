"""
Common helpers for running system commands.

This module centralises logic to execute external commands and return a
structured result that can be reused across system-related modules.
"""

from __future__ import annotations

import subprocess
from typing import Any, Dict, List


def run_command(cmd: List[str]) -> Dict[str, Any]:
    """
    Run a command and capture its result as a dictionary.

    Args:
        cmd: Command and arguments to execute.

    Returns:
        Dict[str, Any]: Dictionary with keys:
            - ``"ok"`` (bool): True if the command exited with status 0.
            - ``"stdout"`` (str): Captured standard output (stripped).
            - ``"stderr"`` (str): Captured standard error (stripped).
    """
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
        )
        return {
            "ok": True,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except FileNotFoundError:
        return {
            "ok": False,
            "stdout": "",
            "stderr": "command not found: " + " ".join(cmd),
        }
    except subprocess.CalledProcessError as exc:
        return {
            "ok": False,
            "stdout": (exc.stdout or "").strip(),
            "stderr": (exc.stderr or "").strip(),
        }

