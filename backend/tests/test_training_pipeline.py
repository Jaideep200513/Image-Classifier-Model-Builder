import os
import shutil
import tempfile
import time
from PIL import Image
import numpy as np
from app.services.dataset_service import DatasetService
from app.services.training_service import TrainingService

def test_full_training_flow():
    tmp_dir = tempfile.mkdtemp()
    try:
        ds = DatasetService(uploads_dir=tmp_dir)
        ts = TrainingService(uploads_dir=tmp_dir)

        proj = ds.create_project(name="Pipeline Test", type="image")
        proj_id = proj["id"]

        # Create 10 images in Class 1 & Class 2
        for cls in proj["classes"]:
            cls_dir = os.path.join(tmp_dir, proj_id, cls["name"])
            os.makedirs(cls_dir, exist_ok=True)
            for i in range(10):
                img_array = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
                img = Image.fromarray(img_array)
                img.save(os.path.join(cls_dir, f"sample_{i}.jpg"))

        # 1. Validate dataset
        val_info = ts.validate_dataset(proj_id)
        assert len(val_info["enabled_classes"]) == 2

        # 2. Start background training for 2 epochs
        job_state = ts.start_training(proj_id, epochs=2, batch_size=4, learning_rate=0.001)
        assert job_state["status"] == "training"

        # 3. Wait for training to complete
        start = time.time()
        while time.time() - start < 60:
            status = ts.get_status(proj_id)
            if status["status"] in ("completed", "error"):
                break
            time.sleep(1)

        final_status = ts.get_status(proj_id)
        assert final_status["status"] == "completed", f"Training failed: {final_status.get('error')}"
        assert final_status["progress"] == 100.0
        assert final_status["has_trained_model"] is True
        assert final_status["metrics"] is not None
        assert "train_accuracy" in final_status["metrics"]
        assert "val_accuracy" in final_status["metrics"]

        # Check saved model file
        model_file = os.path.join(tmp_dir, proj_id, "models", "model.keras")
        assert os.path.exists(model_file), "model.keras file was not created"

        print("Test passed successfully!")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

if __name__ == "__main__":
    test_full_training_flow()
