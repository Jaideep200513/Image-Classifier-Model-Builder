import os
import re
import json
import zipfile
import io
from app.services.dataset_service import DatasetService

def sanitize_filename(name: str) -> str:
    if not name:
        return "unnamed"
    sanitized = re.sub(r'[\<\>:"/\\\|\?\*\x00-\x1f]', '_', name).strip()
    return sanitized.rstrip('. ') or "unnamed"

# Patch dataset_service to test import
file_path = r"C:\Users\lenovo\Downloads\project (1) (1).tm"
tmp_uploads = r"C:\VSCODE PROJECTS\image-model-builder\backend\scratch_uploads"
ds = DatasetService(uploads_dir=tmp_uploads)

# Test sanitization
print("Test sanitized name:", sanitize_filename('Bell UH-1H Iroquois "Huey"'))

with open(file_path, "rb") as f:
    content = f.read()

# Let's inspect class names extracted from this .tm file
all_classes = set()
with zipfile.ZipFile(io.BytesIO(content), "r") as zf:
    for member in zf.infolist():
        if member.is_dir():
            continue
        base = os.path.basename(member.filename)
        if "-!-" in base:
            cname = base.split("-!-")[0].strip()
            all_classes.add(cname)

print("Extracted classes count:", len(all_classes))
print("Classes sample:", list(all_classes)[:5])
