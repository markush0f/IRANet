from fastapi import FastAPI
from app.core.config import load_config
from app.api.health import router as health_router
from app.api.system import router as system_router

app = FastAPI(
    title="Ira API",
    description="Infrastructure Runtime Analyzer",
    version="0.1.0",
)

config = load_config()

app.include_router(health_router)
app.include_router(system_router)


@app.get("/config")
def get_config():
    """Get the current configuration settings."""
    return config
