from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from app.schemas.export import ExportInfoResponse
from app.services.export_service import ExportService

router = APIRouter(prefix="/projects", tags=["export"])

def get_export_service() -> ExportService:
    from app.main import export_service
    return export_service

@router.get("/{id}/export/info", response_model=ExportInfoResponse)
def get_export_info(id: str, service: ExportService = Depends(get_export_service)):
    return service.get_export_info(id)

@router.get("/{id}/export/keras")
def download_export_keras(id: str, service: ExportService = Depends(get_export_service)):
    zip_buffer, filename = service.export_keras_zip(id)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{id}/export/savedmodel")
def download_export_savedmodel(id: str, service: ExportService = Depends(get_export_service)):
    zip_buffer, filename = service.export_savedmodel_zip(id)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{id}/export/tfjs")
def download_export_tfjs(id: str, service: ExportService = Depends(get_export_service)):
    zip_buffer, filename = service.export_tfjs_zip(id)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{id}/export/tm")
def download_export_tm(id: str, service: ExportService = Depends(get_export_service)):
    zip_buffer, filename = service.export_tm_zip(id)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

