from fastapi import FastAPI
from app.core.config import load_config
from app.api.health import router as health_router

app = FastAPI(
    title="Ira API",
    description="Infrastructure Runtime Analyzer",
    version="0.1.0",
)

config = load_config()

app.include_router(health_router)


@app.get("/config")
def get_config():
    """Get the current configuration settings."""
    return config
