from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.schemas.inference import ModelStatusResponse, PredictionResponse, WebcamPredictRequest
from app.services.inference_service import InferenceService

router = APIRouter(prefix="/projects", tags=["inference"])

def get_inference_service() -> InferenceService:
    from app.main import inference_service
    return inference_service

@router.get("/{id}/model-status", response_model=ModelStatusResponse)
def get_model_status(id: str, service: InferenceService = Depends(get_inference_service)):
    return service.check_model_status(id)

@router.post("/{id}/predict/image", response_model=PredictionResponse)
async def predict_image(id: str, file: UploadFile = File(...), service: InferenceService = Depends(get_inference_service)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format (JPEG, PNG, WEBP).")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    return service.predict_bytes(project_id=id, image_bytes=contents)

@router.post("/{id}/predict/webcam", response_model=PredictionResponse)
def predict_webcam(id: str, req: WebcamPredictRequest, service: InferenceService = Depends(get_inference_service)):
    return service.predict_base64(project_id=id, base64_str=req.image_data)
