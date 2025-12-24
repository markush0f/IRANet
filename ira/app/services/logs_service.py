from typing import Dict, List, Optional, Sequence, Set
from uuid import UUID
from pathlib import Path

from fastapi import WebSocket
from sqlalchemy.exc import IntegrityError

from app.core.logger import get_logger
from app.modules.logs.inspector import list_log_files
from app.modules.logs.reader import read_last_lines
from app.modules.logs.resolver import resolve_log_files
from app.modules.logs.tail import tail_file
from app.modules.scanner.logs import detect_log_base_paths, detect_log_paths
from app.repositories.logs import ApplicationLogRepository
from app.utils.logs_parser import parse_log_line, passes_filters

logger = get_logger()


class ApplicationLogsService:
    def __init__(self, session) -> None:
        self._repo = ApplicationLogRepository(session)


    async def attach_log_paths(
        self,
        *,
        application_id: UUID,
        workdir: str,
    ) -> None:
        base_paths = detect_log_base_paths(workdir)

        await self.attach_log_base_paths(
            application_id=application_id,
            base_paths=base_paths,
        )

    async def attach_log_base_paths(
        self,
        *,
        application_id: UUID,
        base_paths: list[str],
    ) -> None:
        session = self._repo._session

        for base_path in base_paths:
            try:
                await self._repo.insert(
                    application_id=application_id,
                    base_path=base_path,
                    enabled=True,
                    discovered=False,
                )
                await session.flush()
            except IntegrityError:
                await session.rollback()

        await session.commit()

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

        allowed_base_paths = await self._repo.list_active_base_paths(
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

    async def get_application_log_files(
        self,
        *,
        application_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict:
        base_paths = await self._repo.list_active_base_paths(
            application_id=application_id,
        )

        all_files: List[Dict] = []

        for base_path in base_paths:
            all_files.extend(list_log_files(directory=base_path))

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

    async def get_application_log_file_history(
        self,
        *,
        application_id: UUID,
        file_path: str,
        limit: int = 200,
    ) -> List[str]:
        allowed_base_paths = await self._repo.list_active_base_paths(
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

    async def get_application_log_base_paths(
        self,
        *,
        application_id: UUID,
    ) -> Sequence[str]:
        return await self._repo.list_active_base_paths(
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
