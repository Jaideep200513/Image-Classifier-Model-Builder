import os
import re
import json
import zipfile
import io

def sanitize_filename(name: str) -> str:
    if not name:
        return "unnamed"
    sanitized = re.sub(r'[\<\>:"/\\\|\?\*\x00-\x1f]', '_', name).strip()
    return sanitized.rstrip('. ') or "unnamed"

file_path = r"C:\Users\lenovo\Downloads\project (1) (1).tm"
print("File exists:", os.path.exists(file_path))

with open(file_path, "rb") as f:
    file_bytes = f.read()

with zipfile.ZipFile(io.BytesIO(file_bytes), "r") as zf:
    members = zf.infolist()
    print("Total archive members:", len(members))
    sample_files = [m.filename for m in members[:10]]
    print("Sample filenames in archive:")
    for s in sample_files:
        print("  -", s)
