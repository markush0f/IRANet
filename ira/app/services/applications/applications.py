from typing import Dict, List, Sequence
from uuid import UUID
from app.models.dto.application_logs_dto import ApplicationsLogsDTO
from app.models.entities.application import Application
from app.models.requests.create_application_request import CreateApplicationRequest
from app.modules.scanner.models import ScannedProcess
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

        await self._logs_service.attach_logs(
            application_id=application.id,
            workdir=data.cwd,
        )

        return application.id

    async def list_applications(self) -> Sequence[Application]:
        applications = await self.applications_repository.list_all()
        return applications

    async def list_applications_with_logs_paths(
        self,
    ) -> Sequence[ApplicationsLogsDTO]:
        applications = await self.applications_repository.list_all()

        result: List[ApplicationsLogsDTO] = []

        for application in applications:
            log_paths = await self._logs_service.get_applications_path_logs(
                application_id=application.id
            )

            result.append(
                {
                    "kind": application.kind,
                    "identifier": application.identifier,
                    "name": application.name,
                    "workdir": application.workdir,
                    "file_path": application.file_path,
                    "port": application.port,
                    "pid": application.pid,
                    "log_paths": log_paths,
                }
            )

        return result
