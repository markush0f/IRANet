from __future__ import annotations

import asyncio
from typing import Any, Mapping

import requests
from fastapi import HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_agent_shared_token, get_server_id, is_control_plane_role
from app.repositories.servers import ServerRepository


class RemoteAgentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._servers = ServerRepository(session)

    def require_live_server_id(self, server_id: str | None) -> str:
        if server_id:
            return server_id

        if is_control_plane_role():
            raise HTTPException(
                status_code=400,
                detail="server_id is required for live multiserver endpoints",
            )

        return get_server_id()

    def validate_local_scope(self, server_id: str | None) -> None:
        if server_id is None:
            return

        local_server_id = get_server_id()
        if server_id != local_server_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"server_id '{server_id}' does not belong to this agent "
                    f"(local server_id is '{local_server_id}')"
                ),
            )

    def should_proxy(self, server_id: str) -> bool:
        return is_control_plane_role()

    async def get_server(self, server_id: str):
        return await self._servers.get_by_id(server_id)

    async def get_json(
        self,
        *,
        server_id: str,
        path: str,
        params: Mapping[str, Any] | None = None,
    ) -> Any:
        return await self._request_json(
            server_id=server_id,
            method="GET",
            path=path,
            params=params,
        )

    async def post_json(
        self,
        *,
        server_id: str,
        path: str,
        params: Mapping[str, Any] | None = None,
        json_body: Any = None,
    ) -> Any:
        return await self._request_json(
            server_id=server_id,
            method="POST",
            path=path,
            params=params,
            json_body=json_body,
        )

    async def _request_json(
        self,
        *,
        server_id: str,
        method: str,
        path: str,
        params: Mapping[str, Any] | None = None,
        json_body: Any = None,
    ) -> Any:
        server = await self.get_server(server_id)
        if server is None:
            raise HTTPException(status_code=404, detail="Server not found")
        if not server.agent_base_url:
            raise HTTPException(
                status_code=409,
                detail=f"Server '{server_id}' is missing agent_base_url",
            )

        url = f"{server.agent_base_url.rstrip('/')}/{path.lstrip('/')}"
        headers = {"Accept": "application/json"}

        token = get_agent_shared_token()
        if token:
            headers["X-IRA-Agent-Token"] = token

        def _send_request() -> Any:
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json_body,
                    headers=headers,
                    timeout=20,
                )
            except requests.RequestException as exc:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Remote agent request failed for server '{server_id}': {exc}"
                    ),
                ) from exc

            if not response.ok:
                detail: Any
                try:
                    detail = response.json()
                except ValueError:
                    detail = response.text or response.reason

                raise HTTPException(
                    status_code=response.status_code,
                    detail=detail,
                )

            if not response.content:
                return None

            try:
                return response.json()
            except ValueError as exc:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Remote agent '{server_id}' returned a non-JSON response for {path}"
                    ),
                ) from exc

        return await asyncio.to_thread(_send_request)
