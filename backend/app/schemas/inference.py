from pydantic import BaseModel, Field
from typing import List, Optional

class ModelStatusResponse(BaseModel):
    has_model: bool
    trained_at: Optional[str] = None
    classes: List[str] = []
    error: Optional[str] = None

class ClassPrediction(BaseModel):
    class_id: str
    class_name: str
    confidence: float  # Percentage 0 - 100
    is_highest: bool = False
    color: str = "bg-primary"

class PredictionResponse(BaseModel):
    predicted_class_id: str
    predicted_class_name: str
    confidence: float  # Top prediction percentage 0 - 100
    prediction_time_ms: float
    formatted_prediction_time: str
    predictions: List[ClassPrediction]

class WebcamPredictRequest(BaseModel):
    image_data: str  # Base64 encoded image string (e.g. data:image/jpeg;base64,...)
