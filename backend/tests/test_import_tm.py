import json
import base64
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 1x1 white JPEG base64 payload
TINY_JPEG_B64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

def test_import_tm_project_endpoint():
    tm_data = {
        "name": "Exported Animal Model",
        "classes": [
            {
                "name": "Cats",
                "images": [TINY_JPEG_B64, TINY_JPEG_B64]
            },
            {
                "name": "Dogs",
                "images": [TINY_JPEG_B64]
            }
        ]
    }
    tm_bytes = json.dumps(tm_data).encode("utf-8")

    res = client.post(
        "/projects/test-import-project/import-tm",
        files={"file": ("project.tm", tm_bytes, "application/json")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "test-import-project"
    assert data["name"] == "Exported Animal Model"
    assert len(data["classes"]) == 2
    assert data["classes"][0]["name"] == "Cats"
    assert len(data["classes"][0]["images"]) == 2
    assert data["classes"][1]["name"] == "Dogs"
    assert len(data["classes"][1]["images"]) == 1

def test_import_user_real_tm_zip():
    import os
    tm_path = r"C:\Users\lenovo\Downloads\project.tm"
    if os.path.exists(tm_path):
        with open(tm_path, "rb") as f:
            tm_bytes = f.read()

        res = client.post(
            "/projects/test-user-tm/import-tm",
            files={"file": ("project.tm", tm_bytes, "application/octet-stream")}
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["classes"]) == 2
        class_names = [c["name"] for c in data["classes"]]
        assert "DARK" in class_names
        assert "BRIGHT" in class_names
        dark_cls = next(c for c in data["classes"] if c["name"] == "DARK")
        bright_cls = next(c for c in data["classes"] if c["name"] == "BRIGHT")
        assert len(dark_cls["images"]) == 13
        assert len(bright_cls["images"]) == 12

def test_export_and_reimport_tm_archive():
    # 1. Create a project
    res_proj = client.post("/projects", json={"name": "Roundtrip Proj"})
    assert res_proj.status_code == 200
    proj_id = res_proj.json()["id"]
    cls_1_id = res_proj.json()["classes"][0]["id"]

    # 2. Upload an image sample
    from PIL import Image
    import io
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    client.post(f"/classes/{cls_1_id}/upload", files=[("files", ("test.jpg", buf.getvalue(), "image/jpeg"))])

    # 3. Export .tm archive
    res_export = client.get(f"/projects/{proj_id}/export/tm")
    assert res_export.status_code == 200
    tm_bytes = res_export.content

    # 4. Import exported .tm archive into a new project
    new_proj_id = "reimported-project"
    res_import = client.post(
        f"/projects/{new_proj_id}/import-tm",
        files={"file": ("export.tm", tm_bytes, "application/octet-stream")}
    )
    assert res_import.status_code == 200
    imported = res_import.json()
    assert len(imported["classes"]) >= 1

    img_url = imported["classes"][0]["images"][0]["url"]
    assert img_url.startswith(f"/uploads/{new_proj_id}/")

    # 5. Fetch image file from static server to verify it exists and loads (HTTP 200)
    res_img = client.get(img_url)
    assert res_img.status_code == 200

