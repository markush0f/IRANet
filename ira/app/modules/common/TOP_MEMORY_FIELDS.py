from typing import Literal, Set


TopMemoryField = Literal[
    "MemTotal",
    "MemFree",
    "MemAvailable",
    "Buffers",
    "Cached",
    "SwapTotal",
    "SwapFree",
]


TOP_MEMORY_FIELDS: Set[TopMemoryField] = {
    "MemTotal",
    "MemFree",
    "MemAvailable",
    "Buffers",
    "Cached",
    "SwapTotal",
    "SwapFree",
}


__all__ = ["TopMemoryField", "TOP_MEMORY_FIELDS"]
