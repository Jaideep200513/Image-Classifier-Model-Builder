from fastapi import APIRouter, Depends
from app.schemas.project import Project, CreateProjectRequest, CreateClassRequest, ImageClass
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/projects", tags=["projects"])

def get_dataset_service() -> DatasetService:
    from app.main import dataset_service
    return dataset_service

@router.post("", response_model=Project)
def create_project(req: CreateProjectRequest, service: DatasetService = Depends(get_dataset_service)):
    return service.create_project(name=req.name, type=req.type, description=req.description)

@router.get("/{id}", response_model=Project)
def get_project(id: str, service: DatasetService = Depends(get_dataset_service)):
    return service.get_project(id)

@router.post("/{id}/classes", response_model=ImageClass)
def create_class(id: str, req: CreateClassRequest, service: DatasetService = Depends(get_dataset_service)):
    return service.add_class(id, req.name)

@router.post("/{id}/reset", response_model=Project)
def reset_project(id: str, service: DatasetService = Depends(get_dataset_service)):
    return service.reset_project(id)

