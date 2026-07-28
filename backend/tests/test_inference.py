import os
import io
import shutil
import tempfile
import base64
from PIL import Image
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_inference_endpoints():
    # 1. Create project
    res_proj = client.post("/projects", json={"name": "Inference Test Proj"})
    assert res_proj.status_code == 200
    proj_id = res_proj.json()["id"]

    # 2. Check model status before training
    res_status = client.get(f"/projects/{proj_id}/model-status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["has_model"] is False
    assert "No trained model" in status_data["error"]

    # 3. Add images to project classes
    cls_1_id = res_proj.json()["classes"][0]["id"]
    cls_2_id = res_proj.json()["classes"][1]["id"]

    test_img = Image.new("RGB", (224, 224), color=(255, 0, 0))
    buf = io.BytesIO()
    test_img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    for _ in range(10):
        client.post(f"/classes/{cls_1_id}/upload", files=[("files", ("sample.jpg", img_bytes, "image/jpeg"))])
        client.post(f"/classes/{cls_2_id}/upload", files=[("files", ("sample.jpg", img_bytes, "image/jpeg"))])

    # 4. Train model (2 epochs)
    res_train = client.post(f"/projects/{proj_id}/train", json={"epochs": 2, "batchSize": 4, "learningRate": 0.001})
    assert res_train.status_code == 200

    # Wait for training thread to finish
    import time
    start = time.time()
    while time.time() - start < 30:
        st = client.get(f"/projects/{proj_id}/train/status").json()
        if st["status"] == "completed":
            break
        time.sleep(1)

    # 5. Check model status after training
    res_status_after = client.get(f"/projects/{proj_id}/model-status")
    assert res_status_after.status_code == 200
    assert res_status_after.json()["has_model"] is True

    # 6. Test predict image endpoint
    res_pred_img = client.post(
        f"/projects/{proj_id}/predict/image",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    assert res_pred_img.status_code == 200
    pred_data = res_pred_img.json()
    assert "predicted_class_name" in pred_data
    assert "confidence" in pred_data
    assert "prediction_time_ms" in pred_data
    assert len(pred_data["predictions"]) == 2

    # 7. Test predict webcam endpoint
    b64_str = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode("utf-8")
    res_pred_webcam = client.post(
        f"/projects/{proj_id}/predict/webcam",
        json={"image_data": b64_str}
    )
    assert res_pred_webcam.status_code == 200
    webcam_data = res_pred_webcam.json()
    assert "predicted_class_name" in webcam_data
    assert len(webcam_data["predictions"]) == 2
