import re
import subprocess
from typing import List

from app.modules.system.packages.types import SystemPackage


_LINE_RE = re.compile(
    r"^(?P<name>[^/\s]+)/[^\s]+\s+(?P<version>\S+)\s+(?P<arch>\S+)\s+\[installed\]$"
)


def installed_packages() -> List[SystemPackage]:
    process = subprocess.run(
        ["apt", "list", "--installed"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=True,
    )

    packages: List[SystemPackage] = []

    for raw_line in process.stdout.splitlines():
        line = raw_line.strip()

        if not line or line.startswith("Listing..."):
            continue

        match = _LINE_RE.match(line)
        if not match:
            continue

        packages.append(
            {
                "name": match.group("name"),
                "version": match.group("version"),
                "arch": match.group("arch"),
                "origin": "apt",
            }
        )

    return packages
