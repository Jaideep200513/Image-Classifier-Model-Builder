from fastapi import APIRouter, Depends, HTTPException
from app.schemas.training import TrainingConfigRequest, TrainingStatusResponse
from app.services.training_service import TrainingService

router = APIRouter(prefix="/projects", tags=["training"])

def get_training_service() -> TrainingService:
    from app.main import training_service
    return training_service

@router.post("/{id}/train", response_model=TrainingStatusResponse)
def start_training(id: str, req: TrainingConfigRequest, service: TrainingService = Depends(get_training_service)):
    status_dict = service.start_training(
        project_id=id,
        epochs=req.epochs,
        batch_size=req.batchSize,
        learning_rate=req.learningRate
    )
    return status_dict

@router.get("/{id}/train/status", response_model=TrainingStatusResponse)
def get_training_status(id: str, service: TrainingService = Depends(get_training_service)):
    return service.get_status(id)

@router.post("/{id}/train/cancel", response_model=TrainingStatusResponse)
def cancel_training(id: str, service: TrainingService = Depends(get_training_service)):
    return service.cancel_training(id)
