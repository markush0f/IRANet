from uuid import UUID
from typing import Dict, List, Optional, Sequence, Tuple, Set
from pathlib import Path
from datetime import datetime
import json
import re

from fastapi import WebSocket

from app.modules.logs.inspector import list_log_files
from app.modules.logs.reader import read_last_lines
from app.modules.logs.resolver import resolve_log_files
from app.modules.logs.tail import tail_file
from app.modules.scanner.logs import detect_log_paths
from app.repositories.logs import ApplicationLogRepository
from app.utils.logs_parser import parse_log_line, passes_filters


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


class ApplicationLogsService:
    def __init__(self, session) -> None:
        self._repo = ApplicationLogRepository(session)

    async def attach_logs(
        self,
        *,
        application_id: UUID,
        workdir: str,
        manual_paths: Optional[List[str]] = None,
    ) -> None:
        if manual_paths:
            paths = manual_paths
            discovered = False
        else:
            paths = detect_log_paths(workdir)
            discovered = True

        for path in paths:
            await self._repo.insert(
                application_id=application_id,
                path=path,
                discovered=discovered,
                enabled=True,
            )

    async def rescan_application_logs(
        self,
        *,
        application_id: UUID,
    ) -> int:
        """
        Rescan filesystem paths associated with the application
        and register newly discovered log files.

        Returns the number of new log files added.
        """
        base_paths = await self._repo.list_active_paths(
            application_id=application_id,
        )

        added = 0

        for base_path in base_paths:
            for log_file in resolve_log_files(base_path):
                created = await self._repo.insert_if_not_exists(
                    application_id=application_id,
                    path=log_file,
                    discovered=True,
                    enabled=True,
                )

                if created:
                    added += 1

        return added

    async def stream_application_log_file(
        self,
        *,
        application_id: UUID,
        file_path: str,
        websocket: WebSocket,
        poll_interval: float = 0.5,
        history_limit: int = 200,
        levels: Optional[str] = None,
        search: Optional[str] = None,
    ) -> None:
        await websocket.accept()

        allowed_base_paths = await self._repo.list_active_paths(
            application_id=application_id,
        )

        requested = Path(file_path).resolve()

        if not requested.exists() or not requested.is_file():
            await websocket.close(code=4000)
            return

        if not self._is_allowed_file(
            requested=requested,
            allowed_base_paths=allowed_base_paths,
        ):
            await websocket.close(code=4001)
            return

        allowed_levels: Optional[Set[str]] = None
        if levels:
            allowed_levels = {
                level.strip().lower() for level in levels.split(",") if level.strip()
            }

        search_term = search.lower() if search else None

        history = read_last_lines(
            path=str(requested),
            limit=history_limit,
        )

        for line in history:
            event = self._build_log_event(
                raw_line=line,
                path=str(requested),
                event_type="history",
            )

            if not event:
                continue

            if not passes_filters(
                level=event["level"],
                message=event["message"],
                allowed_levels=allowed_levels,
                search_term=search_term,
            ):
                continue

            await websocket.send_json(event)

        async for line in tail_file(
            path=str(requested),
            interval=poll_interval,
        ):
            event = self._build_log_event(
                raw_line=line,
                path=str(requested),
                event_type="live",
            )

            if not event:
                continue

            if not passes_filters(
                level=event["level"],
                message=event["message"],
                allowed_levels=allowed_levels,
                search_term=search_term,
            ):
                continue

            await websocket.send_json(event)

    async def get_application_log_file_history(
        self,
        *,
        application_id: UUID,
        file_path: str,
        limit: int = 200,
    ) -> List[str]:
        allowed_base_paths = await self._repo.list_active_paths(
            application_id=application_id,
        )

        requested = Path(file_path).resolve()

        for base_path in allowed_base_paths:
            for log_file in resolve_log_files(base_path):
                if Path(log_file).resolve() == requested:
                    return read_last_lines(
                        path=log_file,
                        limit=limit,
                    )

        return []

    async def get_application_log_files(
        self,
        *,
        application_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict:
        paths = await self._repo.list_active_paths(
            application_id=application_id,
        )

        all_files: List[Dict] = []

        for path in paths:
            all_files.extend(list_log_files(directory=path))

        all_files.sort(
            key=lambda f: f["created_at"],
            reverse=True,
        )

        total = len(all_files)
        start = (page - 1) * page_size
        end = start + page_size

        return {
            "page": page,
            "page_size": page_size,
            "total": total,
            "items": all_files[start:end],
        }

    async def get_applications_path_logs(
        self,
        application_id: UUID,
    ) -> Sequence[str]:
        return await self._repo.list_active_paths(
            application_id=application_id,
        )

    def _build_log_event(
        self,
        *,
        raw_line: str,
        path: str,
        event_type: str,
    ) -> Optional[Dict]:
        message, level, timestamp, context = parse_log_line(raw_line)

        if not message:
            return None

        return {
            "path": path,
            "message": message,
            "level": level,
            "timestamp": timestamp.isoformat() if timestamp else None,
            "context": context,
            "type": event_type,
        }

    def _normalize_line(self, line: str) -> str:
        return ANSI_REGEX.sub("", line).strip()

    def _is_allowed_file(
        self,
        *,
        requested: Path,
        allowed_base_paths: Sequence[str],
    ) -> bool:
        for base_path in allowed_base_paths:
            for log_file in resolve_log_files(base_path):
                if Path(log_file).resolve() == requested:
                    return True
        return False
