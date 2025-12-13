from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.system import router as system_router
from app.core.config import load_config
from app.core.logger import get_logger


logger = get_logger(__name__)

app = FastAPI(
    title="Ira API",
    description="Infrastructure Runtime Analyzer",
    version="0.1.0",
)

logger.info("Initialising Ira API application")

config = load_config()

app.include_router(health_router)
app.include_router(system_router)


@app.get("/config")
def get_config():
    """Get the current configuration settings."""
    logger.debug("GET /config called")
    return config
