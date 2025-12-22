
from fastapi import APIRouter

from app.services.clasification.clasification_service import ClasificationService


router = APIRouter(prefix="/services/clasification", tags=["services clasification"])

@router.get("/databases")
def classify_database_services():
    service = ClasificationService()
    return service.classify_database_services()
