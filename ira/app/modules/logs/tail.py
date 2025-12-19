import asyncio
from pathlib import Path
from typing import AsyncIterator


async def tail_file(path: str, interval: float = 0.5) -> AsyncIterator[str]:
    file_path = Path(path)

    if not file_path.exists() or not file_path.is_file():
        return

    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        f.seek(0, 2)

        while True:
            line = f.readline()
            if line:
                yield line.rstrip("\n")
            else:
                await asyncio.sleep(interval)
