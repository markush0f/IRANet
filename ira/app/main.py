from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.system import router as system_router
from app.api.processes import router as processes_router
from app.api.service import router as service_router
from app.core.config import load_config
from app.core.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="Ira API",
    description="Infrastructure Runtime Analyzer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Initialising Ira API application")

config = load_config()

app.include_router(health_router)
app.include_router(system_router)
app.include_router(processes_router)
app.include_router(service_router)

@app.get("/config")
def get_config():
    """Get the current configuration settings."""
    logger.debug("GET /config called")
    return config
