import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.services.dataset_service import DatasetService
from app.api.projects import router as projects_router
from app.api.classes import router as classes_router
from app.api.images import router as images_router

uploads_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
dataset_service = DatasetService(uploads_dir=uploads_directory)

app = FastAPI(
    title="ModelForge API",
    description="Image Classification Model Preparation Platform — Backend API",
    version="0.2.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for thumbnail viewing
app.mount("/uploads", StaticFiles(directory=uploads_directory), name="uploads")

app.include_router(projects_router)
app.include_router(classes_router)
app.include_router(images_router)

@app.get("/")
def read_root():
    return {"message": "ModelForge API is running", "version": "0.2.0"}
