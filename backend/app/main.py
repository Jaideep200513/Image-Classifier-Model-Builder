import os
import shutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load .env file if present (ignored in Docker where env vars are injected)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app.services.dataset_service import DatasetService
from app.services.training_service import TrainingService
from app.services.inference_service import InferenceService
from app.services.export_service import ExportService
from app.api.projects import router as projects_router
from app.api.classes import router as classes_router
from app.api.images import router as images_router
from app.api.training import router as training_router
from app.api.inference import router as inference_router
from app.api.export import router as export_router

uploads_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))

# Cleanly wipe previous uploads directory on server startup/restart so data does not linger
def wipe_uploads_on_startup(directory: str):
    if os.path.exists(directory):
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            try:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
            except Exception:
                pass

wipe_uploads_on_startup(uploads_directory)

dataset_service = DatasetService(uploads_dir=uploads_directory)
training_service = TrainingService(uploads_dir=uploads_directory)
inference_service = InferenceService(uploads_dir=uploads_directory)
export_service = ExportService(uploads_dir=uploads_directory)

app = FastAPI(
    title="ModelForge API",
    description="Image Classification Model Preparation Platform — Backend API",
    version="1.0.0",
)

# Enable CORS — reads CORS_ORIGINS env var (comma-separated list of allowed origins)
# In production, set CORS_ORIGINS=https://yourdomain.com
_raw_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for thumbnail viewing
app.mount("/uploads", StaticFiles(directory=uploads_directory), name="uploads")

app.include_router(projects_router)
app.include_router(classes_router)
app.include_router(images_router)
app.include_router(training_router)
app.include_router(inference_router)
app.include_router(export_router)

@app.get("/")
def read_root():
    return {"message": "ModelForge API is running", "version": "1.0.0"}
