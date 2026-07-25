from fastapi import APIRouter, Depends
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/images", tags=["images"])

def get_dataset_service() -> DatasetService:
    from app.main import dataset_service
    return dataset_service

@router.delete("/{id}")
def delete_image(id: str, service: DatasetService = Depends(get_dataset_service)):
    return service.delete_image(id)
