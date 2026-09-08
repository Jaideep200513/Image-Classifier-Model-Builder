from pydantic import BaseModel
from typing import List, Optional

class ImageItem(BaseModel):
    id: str
    filename: str
    url: str
    class_id: Optional[str] = None
    created_at: Optional[str] = None

class ImageClass(BaseModel):
    id: str
    name: str
    color: str
    disabled: bool = False
    imageCount: int = 0
    images: List[ImageItem] = []

class Project(BaseModel):
    id: str
    name: str
    type: str = "image"
    description: str = ""
    classes: List[ImageClass] = []
    created_at: str

class CreateProjectRequest(BaseModel):
    name: str = "Image Project"
    type: str = "image"
    description: str = ""

class CreateClassRequest(BaseModel):
    name: str

class UpdateClassRequest(BaseModel):
    name: Optional[str] = None
    disabled: Optional[bool] = None

class CaptureImageRequest(BaseModel):
    image_data: str  # Base64 encoded image string (e.g. data:image/jpeg;base64,...)

class ProjectHistoryItem(BaseModel):
    id: str
    name: str
    type: str = "image"
    description: str = ""
    created_at: str
    classes_count: int = 0
    total_images_count: int = 0
    has_trained_model: bool = False
    trained_at: Optional[str] = None
    metrics: Optional[dict] = None
    under_the_hood: Optional[dict] = None
    classes: List[dict] = []

