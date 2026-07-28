from pydantic import BaseModel
from typing import List, Optional

class ExportInfoResponse(BaseModel):
    has_model: bool
    trained_at: Optional[str] = None
    model_size_bytes: int = 0
    formatted_model_size: str = "0 KB"
    classes_count: int = 0
    formats: List[str] = ["keras", "savedmodel"]
    error: Optional[str] = None

class ProjectStatsResponse(BaseModel):
    id: str
    name: str
    description: str = ""
    classes_count: int = 0
    images_count: int = 0
    trained_at: Optional[str] = None
    has_model: bool = False

class UpdateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
