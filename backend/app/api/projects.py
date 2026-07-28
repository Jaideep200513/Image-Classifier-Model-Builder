from fastapi import APIRouter, Depends
from app.schemas.project import Project, CreateProjectRequest, CreateClassRequest, ImageClass
from app.schemas.export import ProjectStatsResponse, UpdateProjectRequest
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

@router.get("/{id}/info", response_model=ProjectStatsResponse)
def get_project_info(id: str, service: DatasetService = Depends(get_dataset_service)):
    return service.get_project_stats(id)

@router.put("/{id}", response_model=Project)
def update_project(id: str, req: UpdateProjectRequest, service: DatasetService = Depends(get_dataset_service)):
    return service.update_project(id, name=req.name, description=req.description)

@router.post("/{id}/duplicate", response_model=Project)
def duplicate_project(id: str, service: DatasetService = Depends(get_dataset_service)):
    return service.duplicate_project(id)

@router.delete("/{id}")
def delete_project(id: str, service: DatasetService = Depends(get_dataset_service)):
    from app.main import training_service, inference_service
    training_service.clear_job(id)
    inference_service.clear_cache(id)
    return service.delete_project(id)

@router.post("/{id}/classes", response_model=ImageClass)
def create_class(id: str, req: CreateClassRequest, service: DatasetService = Depends(get_dataset_service)):
    return service.add_class(id, req.name)

@router.post("/{id}/reset", response_model=Project)
def reset_project(id: str, service: DatasetService = Depends(get_dataset_service)):
    from app.main import training_service, inference_service
    training_service.clear_job(id)
    inference_service.clear_cache(id)
    return service.reset_project(id)

