import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.system import router as system_router
from app.api.processes import router as processes_router
from app.api.system_services import router as system_service_router
from app.api.users import router as users_router
from app.api.metrics import router as metrics_router
from app.api.system_alerts import router as alerts_router
from app.api.applications import router as applications_router
from app.api.internet import router as internet_router
from app.api.logs import router as logs_router
from app.api.system_packages import router as system_packages_router
from app.api.services_clasification import router as services_clasification_router

from app.core.config import load_config
from app.core.logger import get_logger
from app.core.metrics_scheduler import metrics_scheduler
from app.core.database import engine, get_session
from app.services.extensions import ExtensionsService


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background metrics scheduler
    task = asyncio.create_task(metrics_scheduler())

    # Laod enabled extensions from database at startup
    async for session in get_session():
        extensions_service = ExtensionsService(session)

        # Load ai_chat extension if is enabled
        if await extensions_service.extension_is_enabled(extension_id="ai_chat"):
            from extensions.ai_chat.api.router import router as chat_router

            app.include_router(chat_router)
    try:
        yield
    finally:
        # Stop background task and close database engine
        task.cancel()
        await engine.dispose()


app = FastAPI(
    title="Ira API",
    description="Infrastructure Runtime Analyzer",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Initialising Ira API application")


app.include_router(health_router)
app.include_router(system_router)
app.include_router(processes_router)
app.include_router(system_service_router)
app.include_router(users_router)
app.include_router(metrics_router)
app.include_router(alerts_router)
app.include_router(applications_router)
app.include_router(logs_router)
app.include_router(internet_router)
app.include_router(system_packages_router)
app.include_router(services_clasification_router)

config = load_config()


@app.get("/config")
def get_config():
    logger.debug("GET /config called")
    return config
