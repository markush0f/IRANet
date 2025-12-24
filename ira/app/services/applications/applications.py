from typing import List, Sequence
from uuid import UUID

from app.models.dto.application_logs_dto import ApplicationsLogsDTO
from app.models.entities.application import Application
from app.models.requests.create_application_request import CreateApplicationRequest
from app.repositories.applications import ApplicationRepository
from app.services.logs_service import ApplicationLogsService


class ApplicationsService:
    def __init__(self, session) -> None:
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

        # 🔧 CORRECTO: solo base paths
        await self._logs_service.attach_log_paths(
            application_id=application.id,
            workdir=data.cwd,
        )

        return application.id

    async def list_applications(self) -> Sequence[Application]:
        return await self.applications_repository.list_all()

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
