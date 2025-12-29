from typing import List, Sequence
from uuid import UUID

from app.models.dto.application_logs_dto import ApplicationsLogsDTO
from app.models.entities.application import Application
from app.models.entities.application_log import ApplicationLogPath
from app.models.entities.application_metrics import ApplicationMetrics
from app.models.requests.create_application_request import CreateApplicationRequest
from app.models.requests.update_application_request import UpdateApplicationRequest
from app.repositories.applications import ApplicationRepository
from app.services.logs_service import ApplicationLogsService
from app.extensions.ai_chat.tools.registry import tool_class
from sqlmodel import delete, select


@tool_class(name_prefix="applications")
class ApplicationsService:
    def __init__(self, session) -> None:
        self._session = session
        self.applications_repository = ApplicationRepository(session)
        self._logs_service = ApplicationLogsService(session)

    def build_application_identifier(
        self,
        workdir: str,
    ) -> str:
        return f"process:{workdir}"

    async def create_application(
    self,
    *,
        data: CreateApplicationRequest,
    ) -> UUID:
        identifier = self.build_application_identifier(data.cwd)

        existing = await self.applications_repository.get_by_identifier(identifier)
        if existing:
            return existing.id

        application = await self.applications_repository.create(
            kind="process",
            identifier=identifier,
            name=data.name,
            workdir=data.cwd,
            enabled=True,
        )

        if data.log_base_paths:
            await self._logs_service.attach_log_base_paths(
                application_id=application.id,
                base_paths=data.log_base_paths,
            )
        else:
            await self._logs_service.attach_log_paths(
                application_id=application.id,
                workdir=data.cwd,
            )

        return application.id
    


    async def list_applications(self) -> Sequence[Application]:
        return await self.applications_repository.list_all()

    async def delete_application(
        self,
        *,
        application_id: UUID,
    ) -> bool:
        result = await self._session.exec(
            select(Application).where(Application.id == application_id)
        )
        application = result.first()
        if not application:
            return False

        await self._session.exec(
            delete(ApplicationMetrics).where(
                ApplicationMetrics.application_id == application_id
            )
        )
        await self._session.exec(
            delete(ApplicationLogPath).where(
                ApplicationLogPath.application_id == application_id
            )
        )
        await self._session.exec(
            delete(Application).where(Application.id == application_id)
        )
        await self._session.commit()
        return True

    async def update_application(
        self,
        *,
        application_id: UUID,
        data: UpdateApplicationRequest,
    ) -> Application | None:
        result = await self._session.exec(
            select(Application).where(Application.id == application_id)
        )
        application = result.first()
        if not application:
            return None

        application.name = data.name
        self._session.add(application)
        await self._session.commit()
        await self._session.refresh(application)
        return application

    async def applications_lists(
        self,
    ) -> Sequence[ApplicationsLogsDTO]:
        applications = await self.applications_repository.list_all()
        result: List[ApplicationsLogsDTO] = []

        for application in applications:
            base_paths = await self._logs_service.get_application_log_base_paths(
                application_id=application.id
            )

            result.append(
                {
                    "id": application.id,
                    "kind": application.kind,
                    "identifier": application.identifier,
                    "name": application.name,
                    "workdir": application.workdir,
                    "file_path": application.file_path,
                    "port": application.port,
                    "pid": application.pid,
                    # ⚠️ Sigue llamándose log_paths para no romper frontend
                    "log_paths": base_paths,
                }
            )

        return result

    async def applications_list_with_path_logs(
        self,
    ) -> Sequence[ApplicationsLogsDTO]:
        applications = await self.applications_repository.applications_with_path_logs()
        result: List[ApplicationsLogsDTO] = []

        for application in applications:
            base_paths = await self._logs_service.get_application_log_base_paths(
                application_id=application.id
            )

            result.append(
                {
                    "id": application.id,
                    "kind": application.kind,
                    "identifier": application.identifier,
                    "name": application.name,
                    "workdir": application.workdir,
                    "file_path": application.file_path,
                    "port": application.port,
                    "pid": application.pid,
                    "log_paths": base_paths,
                }
            )

        return result
