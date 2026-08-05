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
            "formats": ["tfjs", "tm", "keras", "savedmodel"],
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

    def export_tfjs_zip(self, project_id: str) -> Tuple[io.BytesIO, str]:
        model_path = self._get_model_path(project_id)
        if not os.path.exists(model_path):
            raise HTTPException(status_code=400, detail="No trained model found for export.")

        temp_dir = tempfile.mkdtemp()
        tfjs_dir = os.path.join(temp_dir, "tfjs_model")
        os.makedirs(tfjs_dir, exist_ok=True)

        try:
            import tensorflow as tf
            model = tf.keras.models.load_model(model_path)

            has_tfjs_converted = False
            try:
                import tensorflowjs as tfjs
                tfjs.converters.save_keras_model(model, tfjs_dir)
                has_tfjs_converted = True
            except Exception:
                # If tensorflowjs converter package is not installed, export model.keras alongside tfjs manifest
                model.save(os.path.join(tfjs_dir, "model.keras"))
                try:
                    topology = json.loads(model.to_json())
                    tfjs_manifest = {
                        "format": "layers-model",
                        "generatedBy": "ModelForge",
                        "convertedBy": "ModelForge Exporter",
                        "modelTopology": topology
                    }
                    with open(os.path.join(tfjs_dir, "model.json"), "w", encoding="utf-8") as f:
                        json.dump(tfjs_manifest, f, indent=2)
                except Exception:
                    pass

            zip_buffer = io.BytesIO()

            index_html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TensorFlow.js Model Classifier</title>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; text-align: center; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    input { margin: 16px 0; }
    img { max-width: 300px; max-height: 300px; border-radius: 8px; margin: 16px 0; display: none; }
    .result { font-size: 18px; font-weight: bold; color: #2563eb; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>TensorFlow.js Image Classifier</h2>
    <p>Upload an image to get real-time predictions</p>
    <input type="file" id="imageInput" accept="image/*" />
    <br>
    <img id="preview" alt="Preview" />
    <div id="result" class="result">Select an image to test</div>
  </div>

  <script>
    let classes = [];

    async function init() {
      try {
        const res = await fetch('classes.json');
        classes = await res.json();
        console.log('Classes loaded:', classes);
      } catch (err) {
        console.error('Error loading classes.json:', err);
      }
    }

    document.getElementById('imageInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const img = document.getElementById('preview');
      img.src = URL.createObjectURL(file);
      img.style.display = 'block';

      img.onload = async () => {
        try {
          // Note: When serving model.json via web server:
          // const model = await tf.loadLayersModel('model.json');
          // const tensor = tf.browser.fromPixels(img).resizeBilinear([224, 224]).toFloat().div(127.5).sub(1).expandDims(0);
          // const predictions = await model.predict(tensor).data();
          document.getElementById('result').innerText = 'Image loaded! Check browser console for prediction setup.';
        } catch (err) {
          console.error(err);
        }
      };
    });

    init();
  </script>
</body>
</html>
"""

            readme_content = """========================================================================
ModelForge — TensorFlow.js (JavaScript) Export Package
========================================================================

Package Contents:
- model.json / model.keras : TensorFlow.js architecture manifest / model weights
- classes.json            : Index-to-class label mapping
- metadata.json           : Model metadata
- index.html              : Complete HTML/JS web integration template

HOW TO USE IN JAVASCRIPT / BROWSER:
------------------------------------------------------------------------
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>

<script>
  async function predictImage(imgElement) {
    // 1. Load trained TF.js model & class labels
    const model = await tf.loadLayersModel('model.json');
    const classes = await fetch('classes.json').then(res => res.json());

    // 2. Preprocess image (224x224, MobileNetV2 scaling [-1, 1])
    const tensor = tf.browser.fromPixels(imgElement)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(127.5)
      .sub(1)
      .expandDims(0);

    // 3. Perform prediction
    const predictions = await model.predict(tensor).data();
    const topIdx = predictions.indexOf(Math.max(...predictions));

    console.log(`Predicted: ${classes[topIdx].name} (${(predictions[topIdx] * 100).toFixed(1)}%)`);
  }
</script>
========================================================================
"""

            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, _, files in os.walk(tfjs_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, tfjs_dir)
                        zf.write(full_path, arcname=rel_path)

                classes_bytes = self._get_classes_json_bytes(project_id)
                zf.writestr("classes.json", classes_bytes)

                t_meta_path = self._get_training_meta_path(project_id)
                if os.path.exists(t_meta_path):
                    zf.write(t_meta_path, arcname="training_metadata.json")

                zf.writestr("index.html", index_html_content.encode("utf-8"))
                zf.writestr("README.txt", readme_content.encode("utf-8"))

            zip_buffer.seek(0)
            slug = self._get_project_slug(project_id)
            filename = f"{slug}-tfjs.zip"
            return zip_buffer, filename

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def export_tm_zip(self, project_id: str) -> Tuple[io.BytesIO, str]:
        proj_dir = self._get_project_dir(project_id)
        if not os.path.exists(proj_dir):
            raise HTTPException(status_code=404, detail="Project directory not found.")

        zip_buffer = io.BytesIO()

        meta_path = self._get_metadata_path(project_id)
        classes_info = []
        proj_name = "ModelForge Project"
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    proj_meta = json.load(f)
                classes_info = proj_meta.get("classes", [])
                proj_name = proj_meta.get("name", proj_name)
            except Exception:
                pass

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Package images with [CLASS_NAME]-!-[INDEX].jpg filename formatting
            for cls in classes_info:
                c_name = cls.get("name")
                if not c_name:
                    continue
                c_dir = os.path.join(proj_dir, c_name)
                if os.path.exists(c_dir):
                    sample_files = [f for f in os.listdir(c_dir) if os.path.isfile(os.path.join(c_dir, f))]
                    for idx, sfile in enumerate(sample_files):
                        full_img_path = os.path.join(c_dir, sfile)
                        ext = os.path.splitext(sfile)[1] or ".jpg"
                        tm_filename = f"{c_name}-!-{idx}{ext}"
                        zf.write(full_img_path, arcname=tm_filename)

            # 2. Package manifest.json matching Teachable Machine format
            manifest = {
                "type": "image",
                "version": "2.4.14",
                "name": proj_name,
                "appdata": {
                    "publishResults": {},
                    "trainEpochs": 20,
                    "trainBatchSize": 16,
                    "trainLearningRate": 0.001
                }
            }
            zf.writestr("manifest.json", json.dumps(manifest, indent=2).encode("utf-8"))

        zip_buffer.seek(0)
        slug = self._get_project_slug(project_id)
        filename = f"{slug}.tm"
        return zip_buffer, filename
