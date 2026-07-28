import os
import io
import json
import zipfile
import tempfile
import shutil
import re
from typing import Dict, Any, Tuple
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

class ExportService:
    def __init__(self, uploads_dir: str):
        self.uploads_dir = os.path.abspath(uploads_dir)

    def _get_project_dir(self, project_id: str) -> str:
        return os.path.join(self.uploads_dir, project_id)

    def _get_model_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "models", "model.keras")

    def _get_training_meta_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "training_metadata.json")

    def _get_metadata_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "metadata.json")

    def _get_project_slug(self, project_id: str) -> str:
        meta_path = self._get_metadata_path(project_id)
        slug_name = project_id
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("name"):
                        slug_name = data["name"].strip()
            except Exception:
                pass
        clean_slug = re.sub(r'[^a-zA-Z0-9_\-]+', '-', slug_name).strip('-')
        return clean_slug.lower() if clean_slug else project_id

    def format_size(self, bytes_size: int) -> str:
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{bytes_size / 1024:.1f} KB"
        else:
            return f"{bytes_size / (1024 * 1024):.1f} MB"

    def get_export_info(self, project_id: str) -> Dict[str, Any]:
        model_path = self._get_model_path(project_id)
        if not os.path.exists(model_path):
            return {
                "has_model": False,
                "trained_at": None,
                "model_size_bytes": 0,
                "formatted_model_size": "0 KB",
                "classes_count": 0,
                "formats": ["keras", "savedmodel"],
                "error": "No trained model available. Train a model first to enable export."
            }

        size_bytes = os.path.getsize(model_path)
        formatted_size = self.format_size(size_bytes)

        trained_at = None
        classes_count = 0

        training_meta_path = self._get_training_meta_path(project_id)
        if os.path.exists(training_meta_path):
            try:
                with open(training_meta_path, "r", encoding="utf-8") as f:
                    t_meta = json.load(f)
                trained_at = t_meta.get("trained_at")
                classes_count = len(t_meta.get("classes", []))
            except Exception:
                pass

        if classes_count == 0:
            meta_path = self._get_metadata_path(project_id)
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    classes_count = len([c for c in meta.get("classes", []) if not c.get("disabled", False)])
                except Exception:
                    pass

        return {
            "has_model": True,
            "trained_at": trained_at,
            "model_size_bytes": size_bytes,
            "formatted_model_size": formatted_size,
            "classes_count": classes_count,
            "formats": ["keras", "savedmodel"],
            "error": None
        }

    def _get_classes_json_bytes(self, project_id: str) -> bytes:
        meta_path = self._get_metadata_path(project_id)
        classes_data = []
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                enabled = [c for c in meta.get("classes", []) if not c.get("disabled", False)]
                for idx, c in enumerate(enabled):
                    classes_data.append({
                        "index": idx,
                        "id": c["id"],
                        "name": c["name"],
                        "color": c.get("color", "")
                    })
            except Exception:
                pass

        if not classes_data:
            training_meta_path = self._get_training_meta_path(project_id)
            if os.path.exists(training_meta_path):
                try:
                    with open(training_meta_path, "r", encoding="utf-8") as f:
                        t_meta = json.load(f)
                    for idx, c_name in enumerate(t_meta.get("classes", [])):
                        classes_data.append({
                            "index": idx,
                            "id": f"class-{idx+1}",
                            "name": c_name
                        })
                except Exception:
                    pass

        return json.dumps(classes_data, indent=2).encode("utf-8")

    def export_keras_zip(self, project_id: str) -> Tuple[io.BytesIO, str]:
        model_path = self._get_model_path(project_id)
        if not os.path.exists(model_path):
            raise HTTPException(status_code=400, detail="No trained model found for export.")

        zip_buffer = io.BytesIO()

        readme_content = """========================================================================
ModelForge — Keras Model Export Package
========================================================================

Package Contents:
- model.keras           : Trained Keras MobileNetV2 image classification model
- classes.json          : Index-to-class mapping and class metadata
- training_metadata.json: Training metrics, epoch history, and timestamp

HOW TO USE IN PYTHON:
------------------------------------------------------------------------
import json
import numpy as np
import tensorflow as tf
from PIL import Image

# 1. Load model and class mapping
model = tf.keras.models.load_model('model.keras')
with open('classes.json', 'r') as f:
    classes = json.load(f)

# 2. Load and preprocess image (224x224, MobileNetV2 scaling)
img = Image.open('your_test_image.jpg').convert('RGB').resize((224, 224))
arr = np.array(img, dtype=np.float32)
arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
batch = np.expand_dims(arr, axis=0)

# 3. Perform prediction
predictions = model.predict(batch)[0]
top_idx = int(np.argmax(predictions))
top_class = classes[top_idx]['name']
confidence = predictions[top_idx] * 100

print(f"Predicted Class: {top_class} ({confidence:.1f}%)")
========================================================================
"""

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(model_path, arcname="model.keras")

            classes_bytes = self._get_classes_json_bytes(project_id)
            zf.writestr("classes.json", classes_bytes)

            t_meta_path = self._get_training_meta_path(project_id)
            if os.path.exists(t_meta_path):
                zf.write(t_meta_path, arcname="training_metadata.json")

            zf.writestr("README.txt", readme_content.encode("utf-8"))

        zip_buffer.seek(0)
        slug = self._get_project_slug(project_id)
        filename = f"{slug}-keras.zip"
        return zip_buffer, filename

    def export_savedmodel_zip(self, project_id: str) -> Tuple[io.BytesIO, str]:
        model_path = self._get_model_path(project_id)
        if not os.path.exists(model_path):
            raise HTTPException(status_code=400, detail="No trained model found for export.")

        import tensorflow as tf

        try:
            model = tf.keras.models.load_model(model_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load Keras model for SavedModel export: {str(e)}")

        temp_dir = tempfile.mkdtemp()
        saved_model_dir = os.path.join(temp_dir, "saved_model")

        try:
            # Export to TensorFlow SavedModel format using Keras 3 export API
            try:
                model.export(saved_model_dir)
            except Exception:
                tf.keras.models.save_model(model, saved_model_dir)

            zip_buffer = io.BytesIO()

            readme_content = """========================================================================
ModelForge — TensorFlow SavedModel Export Package
========================================================================

Package Contents:
- saved_model/          : TensorFlow SavedModel directory (saved_model.pb & variables/)
- classes.json          : Index-to-class mapping and metadata
- training_metadata.json: Training metrics and timestamp

HOW TO USE IN PYTHON (SavedModel):
------------------------------------------------------------------------
import json
import numpy as np
import tensorflow as tf
from PIL import Image

# 1. Load SavedModel
model = tf.saved_model.load('saved_model')
infer = model.signatures['serving_default']

# 2. Preprocess input image (224x224, MobileNetV2 scaling)
img = Image.open('your_test_image.jpg').convert('RGB').resize((224, 224))
arr = np.array(img, dtype=np.float32)
arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
batch = tf.convert_to_tensor(np.expand_dims(arr, axis=0))

# 3. Predict
outputs = infer(batch)
preds = list(outputs.values())[0].numpy()[0]
top_idx = int(np.argmax(preds))

with open('classes.json', 'r') as f:
    classes = json.load(f)

print(f"Predicted Class: {classes[top_idx]['name']} ({preds[top_idx]*100:.1f}%)")
========================================================================
"""

            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                # Add all files in saved_model directory recursively
                for root, _, files in os.walk(saved_model_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, temp_dir)
                        zf.write(full_path, arcname=rel_path)

                classes_bytes = self._get_classes_json_bytes(project_id)
                zf.writestr("classes.json", classes_bytes)

                t_meta_path = self._get_training_meta_path(project_id)
                if os.path.exists(t_meta_path):
                    zf.write(t_meta_path, arcname="training_metadata.json")

                zf.writestr("README.txt", readme_content.encode("utf-8"))

            zip_buffer.seek(0)
            slug = self._get_project_slug(project_id)
            filename = f"{slug}-savedmodel.zip"
            return zip_buffer, filename

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
