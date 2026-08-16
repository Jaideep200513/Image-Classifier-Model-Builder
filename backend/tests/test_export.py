import os
import io
import zipfile
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_export_and_project_management():
    # 1. Create project
    res_proj = client.post("/projects", json={"name": "Export Test Project", "description": "Testing export & management"})
    assert res_proj.status_code == 200
    proj_id = res_proj.json()["id"]

    # 2. Test Duplicate Class Name Validation
    cls_1_name = res_proj.json()["classes"][0]["name"]
    res_dup_cls = client.post(f"/projects/{proj_id}/classes", json={"name": cls_1_name})
    assert res_dup_cls.status_code == 400
    assert "already exists" in res_dup_cls.json()["detail"]

    # 3. Test Export Info before training
    res_info_before = client.get(f"/projects/{proj_id}/export/info")
    assert res_info_before.status_code == 200
    assert res_info_before.json()["has_model"] is False

    # 4. Upload images & train model
    cls_1_id = res_proj.json()["classes"][0]["id"]
    cls_2_id = res_proj.json()["classes"][1]["id"]

    test_img = Image.new("RGB", (224, 224), color=(0, 255, 0))
    buf = io.BytesIO()
    test_img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    for _ in range(10):
        client.post(f"/classes/{cls_1_id}/upload", files=[("files", ("test.jpg", img_bytes, "image/jpeg"))])
        client.post(f"/classes/{cls_2_id}/upload", files=[("files", ("test.jpg", img_bytes, "image/jpeg"))])

    client.post(f"/projects/{proj_id}/train", json={"epochs": 2, "batchSize": 4, "learningRate": 0.001})

    import time
    start = time.time()
    while time.time() - start < 60:
        st = client.get(f"/projects/{proj_id}/train/status").json()
        if st["status"] == "completed":
            break
        time.sleep(1)

    # 5. Test Export Info after training
    res_info_after = client.get(f"/projects/{proj_id}/export/info")
    assert res_info_after.status_code == 200
    assert res_info_after.json()["has_model"] is True
    assert res_info_after.json()["model_size_bytes"] > 0

    # 6. Test Download Keras Zip Bundle
    res_keras_zip = client.get(f"/projects/{proj_id}/export/keras")
    assert res_keras_zip.status_code == 200
    assert res_keras_zip.headers["content-type"] == "application/zip"

    with zipfile.ZipFile(io.BytesIO(res_keras_zip.content)) as zf:
        file_list = zf.namelist()
        assert "keras_model.h5" in file_list
        assert "labels.txt" in file_list

    # 7. Test Download SavedModel Zip Archive
    res_sm_zip = client.get(f"/projects/{proj_id}/export/savedmodel")
    assert res_sm_zip.status_code == 200
    assert res_sm_zip.headers["content-type"] == "application/zip"

    with zipfile.ZipFile(io.BytesIO(res_sm_zip.content)) as zf:
        file_list = zf.namelist()
        assert "classes.json" in file_list
        assert "README.txt" in file_list
        assert any("saved_model" in f for f in file_list)

    # 7.5. Test Download TensorFlow.js Zip Package
    res_tfjs_zip = client.get(f"/projects/{proj_id}/export/tfjs")
    assert res_tfjs_zip.status_code == 200
    assert res_tfjs_zip.headers["content-type"] == "application/zip"
    with zipfile.ZipFile(io.BytesIO(res_tfjs_zip.content)) as zf:
        file_list = zf.namelist()
        assert "metadata.json" in file_list
        assert "model.json" in file_list
        assert "weights.bin" in file_list

    # 7.6. Test Download Teachable Machine (.tm) Archive
    res_tm_zip = client.get(f"/projects/{proj_id}/export/tm")
    assert res_tm_zip.status_code == 200
    assert res_tm_zip.headers["content-type"] == "application/zip"
    with zipfile.ZipFile(io.BytesIO(res_tm_zip.content)) as zf:
        file_list = zf.namelist()
        assert "manifest.json" in file_list
        assert any("-!-" in f for f in file_list)

    # 8. Test Project Info Stats
    res_stats = client.get(f"/projects/{proj_id}/info")
    assert res_stats.status_code == 200
    assert res_stats.json()["classes_count"] == 2
    assert res_stats.json()["images_count"] == 20

    # 9. Test Update Project Name
    res_update = client.put(f"/projects/{proj_id}", json={"name": "Renamed Export Proj", "description": "Updated desc"})
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Renamed Export Proj"

    # 10. Test Duplicate Project
    res_dup = client.post(f"/projects/{proj_id}/duplicate")
    assert res_dup.status_code == 200
    dup_id = res_dup.json()["id"]
    assert "Copy" in res_dup.json()["name"]

    # 11. Test Delete Project
    res_del = client.delete(f"/projects/{dup_id}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True
