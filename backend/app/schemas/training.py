from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class TrainingConfigRequest(BaseModel):
    epochs: int = Field(default=50, ge=1, le=500)
    batchSize: int = Field(default=16, ge=1, le=512)
    learningRate: float = Field(default=0.001, gt=0)

class TrainingMetrics(BaseModel):
    train_accuracy: float
    val_accuracy: float
    train_loss: float
    val_loss: float
    duration_seconds: Optional[float] = None
    formatted_duration: Optional[str] = None

class TrainingStatusResponse(BaseModel):
    status: str  # "idle" | "training" | "completed" | "error"
    progress: float  # 0 to 100
    current_epoch: int
    total_epochs: int
    elapsed_time: float  # seconds
    formatted_elapsed_time: str
    metrics: Optional[TrainingMetrics] = None
    error: Optional[str] = None
    has_trained_model: bool = False
    trained_at: Optional[str] = None
