from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.schemas.project import ImageClass, UpdateClassRequest, CaptureImageRequest, ImageItem
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/classes", tags=["classes"])

def get_dataset_service() -> DatasetService:
    from app.main import dataset_service
    return dataset_service

@router.patch("/{id}", response_model=ImageClass)
def update_class(id: str, req: UpdateClassRequest, project_id: Optional[str] = Query(None), service: DatasetService = Depends(get_dataset_service)):
    return service.update_class(id, name=req.name, disabled=req.disabled, project_id=project_id)

@router.delete("/{id}")
def delete_class(id: str, project_id: Optional[str] = Query(None), service: DatasetService = Depends(get_dataset_service)):
    return service.delete_class(id, project_id=project_id)

@router.post("/{id}/upload", response_model=List[ImageItem])
async def upload_images(id: str, files: List[UploadFile] = File(...), project_id: Optional[str] = Query(None), service: DatasetService = Depends(get_dataset_service)):
    return await service.upload_images(id, files, project_id=project_id)

@router.post("/{id}/capture", response_model=ImageItem)
def capture_image(id: str, req: CaptureImageRequest, project_id: Optional[str] = Query(None), service: DatasetService = Depends(get_dataset_service)):
    return service.capture_image(id, req.image_data, project_id=project_id)

@router.delete("/{id}/images")
def clear_class_images(id: str, project_id: Optional[str] = Query(None), service: DatasetService = Depends(get_dataset_service)):
    return service.clear_class_images(id, project_id=project_id)

