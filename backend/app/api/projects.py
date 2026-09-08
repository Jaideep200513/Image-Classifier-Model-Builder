from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from app.schemas.project import Project, CreateProjectRequest, CreateClassRequest, ImageClass, ProjectHistoryItem
from app.schemas.export import ProjectStatsResponse, UpdateProjectRequest
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/projects", tags=["projects"])

def get_dataset_service() -> DatasetService:
    from app.main import dataset_service
    return dataset_service

@router.get("", response_model=List[ProjectHistoryItem])
def list_projects(service: DatasetService = Depends(get_dataset_service)):
    return service.list_all_projects()

@router.post("", response_model=Project)

def create_project(req: CreateProjectRequest, service: DatasetService = Depends(get_dataset_service)):
    return service.create_project(name=req.name, project_type=req.type, description=req.description)

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

@router.post("/{id}/import-tm", response_model=Project)
async def import_tm_project(id: str, file: UploadFile = File(...), service: DatasetService = Depends(get_dataset_service)):
    from app.main import training_service, inference_service
    training_service.clear_job(id)
    inference_service.clear_cache(id)
    content = await file.read()
    return service.import_tm_project(project_id=id, file_bytes=content, filename=file.filename or "project.tm")




