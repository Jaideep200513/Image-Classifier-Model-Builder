import os
import base64
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_and_get_project():
    # 1. Create project with unique name
    res = client.post("/projects", json={"name": "Fresh Test Project", "type": "image"})
    assert res.status_code == 200
    data = res.json()
    assert "Fresh Test Project" in data["name"]
    project_id = data["id"]
    assert len(data["classes"]) == 2

    # 2. Get project
    res_get = client.get(f"/projects/{project_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == project_id

def test_class_management():
    # Create project
    res_proj = client.post("/projects", json={"name": "Class Test Project Unique"})
    project_id = res_proj.json()["id"]

    # Add class
    res_cls = client.post(f"/projects/{project_id}/classes", json={"name": "Cat"})
    assert res_cls.status_code == 200
    cls_data = res_cls.json()
    assert cls_data["name"] == "Cat"
    class_id = cls_data["id"]

    # Patch class (rename & disable)
    res_patch = client.patch(f"/classes/{class_id}", json={"name": "Feline", "disabled": True})
    assert res_patch.status_code == 200
    patched = res_patch.json()
    assert patched["name"] == "Feline"
    assert patched["disabled"] is True

    # Delete class
    res_del = client.delete(f"/classes/{class_id}")
    assert res_del.status_code == 200

def test_image_upload_capture_delete():
    # Create project & class
    res_proj = client.post("/projects", json={"name": "Image Test Project Unique"})
    project_id = res_proj.json()["id"]
    res_cls = client.post(f"/projects/{project_id}/classes", json={"name": "Dog"})
    class_id = res_cls.json()["id"]

    # Upload dummy image
    test_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    files = [("files", ("test.jpg", test_image_bytes, "image/jpeg"))]
    res_upload = client.post(f"/classes/{class_id}/upload", files=files)
    assert res_upload.status_code == 200
    uploaded_items = res_upload.json()
    assert len(uploaded_items) == 1
    image_id = uploaded_items[0]["id"]

    # Capture image via base64 encoding of test bytes
    valid_base64 = "data:image/jpeg;base64," + base64.b64encode(test_image_bytes).decode("utf-8")
    res_cap = client.post(f"/classes/{class_id}/capture", json={"image_data": valid_base64})
    assert res_cap.status_code == 200
    captured_item = res_cap.json()
    assert captured_item["id"].startswith("img-")

    # Delete uploaded image
    res_del_img = client.delete(f"/images/{image_id}")
    assert res_del_img.status_code == 200

def test_clear_class_images():
    res_proj = client.post("/projects", json={"name": "Clear Class Test Unique"})
    project_id = res_proj.json()["id"]
    res_cls = client.post(f"/projects/{project_id}/classes", json={"name": "Bird"})
    class_id = res_cls.json()["id"]

    test_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xd9"
    files = [("files", ("bird.jpg", test_bytes, "image/jpeg"))]
    client.post(f"/classes/{class_id}/upload", files=files)

    res_clear = client.delete(f"/classes/{class_id}/images")
    assert res_clear.status_code == 200
    assert res_clear.json()["deleted_count"] == 1

    res_get = client.get(f"/projects/{project_id}")
    cls = [c for c in res_get.json()["classes"] if c["id"] == class_id][0]
    assert cls["imageCount"] == 0
    assert len(cls["images"]) == 0

def test_training_status_idle():
    res_proj = client.post("/projects", json={"name": "Training Test Project Unique"})
    project_id = res_proj.json()["id"]

    res_status = client.get(f"/projects/{project_id}/train/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["status"] == "idle"
    assert status_data["progress"] == 0.0

def test_training_validation_failure():
    res_proj = client.post("/projects", json={"name": "Validation Test Project Unique"})
    project_id = res_proj.json()["id"]

    # Try starting training with 0 images in default classes
    res_train = client.post(f"/projects/{project_id}/train", json={"epochs": 5, "batchSize": 16, "learningRate": 0.001})
    assert res_train.status_code == 400
    assert "at least 1 image" in res_train.json()["detail"] or "required for training" in res_train.json()["detail"]

def test_duplicate_project_name_rejection():
    name = "Unique Named Project Alpha"
    res1 = client.post("/projects", json={"name": name})
    assert res1.status_code == 200
    p1_id = res1.json()["id"]

    # Trying to update another project to exact same name should fail with 400
    res2 = client.post("/projects", json={"name": "Unique Named Project Beta"})
    p2_id = res2.json()["id"]

    res_rename_dup = client.put(f"/projects/{p2_id}", json={"name": name})
    assert res_rename_dup.status_code == 400
    assert "already exists" in res_rename_dup.json()["detail"]

def test_list_all_projects_history():
    # Create project and upload 1 image so total_images > 0
    res_proj = client.post("/projects", json={"name": "History Test Project NonEmpty"})
    p_id = res_proj.json()["id"]
    c_id = res_proj.json()["classes"][0]["id"]
    test_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xd9"
    client.post(f"/classes/{c_id}/upload", files=[("files", ("hist.jpg", test_bytes, "image/jpeg"))])

    res = client.get("/projects")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    item = data[0]
    assert "id" in item
    assert "name" in item
    assert "created_at" in item
    assert "total_images_count" in item
    assert item["total_images_count"] > 0




