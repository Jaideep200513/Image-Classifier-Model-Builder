import os
import io
import json
import time
import base64
import threading
import logging
from typing import Dict, Any, Optional, List
from PIL import Image
from fastapi import HTTPException
from app.constants import CLASS_COLORS

logger = logging.getLogger(__name__)

class InferenceService:
    def __init__(self, uploads_dir: str):
        self.uploads_dir = os.path.abspath(uploads_dir)
        self._model_cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _get_project_dir(self, project_id: str) -> str:
        return os.path.join(self.uploads_dir, project_id)

    def _get_model_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "models", "model.keras")

    def _get_training_meta_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "training_metadata.json")

    def _get_metadata_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "metadata.json")

    def clear_cache(self, project_id: str):
        with self._lock:
            if project_id in self._model_cache:
                del self._model_cache[project_id]

    def check_model_status(self, project_id: str) -> Dict[str, Any]:
        model_path = self._get_model_path(project_id)
        if not os.path.exists(model_path):
            return {
                "has_model": False,
                "trained_at": None,
                "classes": [],
                "error": "No trained model available. Please train a model first."
            }

        training_meta_path = self._get_training_meta_path(project_id)
        classes_list = []
        trained_at = None

        if os.path.exists(training_meta_path):
            try:
                with open(training_meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                classes_list = meta.get("classes", [])
                trained_at = meta.get("trained_at")
            except Exception as e:
                logger.warning(f"Failed to read training metadata for project '{project_id}': {e}")

        if not classes_list:
            meta_path = self._get_metadata_path(project_id)
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    classes_list = [c["name"] for c in meta.get("classes", []) if not c.get("disabled", False)]
                except Exception as e:
                    logger.warning(f"Failed to read project metadata for project '{project_id}': {e}")

        return {
            "has_model": True,
            "trained_at": trained_at,
            "classes": classes_list,
            "error": None
        }

    def _get_or_load_model(self, project_id: str) -> Dict[str, Any]:
        model_path = self._get_model_path(project_id)
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=400,
                detail="No trained model found for this project. Please train a model in the Training panel first."
            )

        current_mtime = os.path.getmtime(model_path)

        with self._lock:
            cached = self._model_cache.get(project_id)
            if cached and cached.get("mtime") == current_mtime:
                return cached

            # Load model into memory cache
            import tensorflow as tf

            try:
                model = tf.keras.models.load_model(model_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to load trained TensorFlow model: {str(e)}")

            # Load class details from training metadata / project metadata
            classes_meta = []
            training_meta_path = self._get_training_meta_path(project_id)
            meta_path = self._get_metadata_path(project_id)

            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        proj_meta = json.load(f)
                    enabled_cls = [c for c in proj_meta.get("classes", []) if not c.get("disabled", False)]
                    for idx, c in enumerate(enabled_cls):
                        classes_meta.append({
                            "id": c["id"],
                            "name": c["name"],
                            "color": c.get("color", CLASS_COLORS[idx % len(CLASS_COLORS)])
                        })
                except Exception as e:
                    logger.warning(f"Failed to read metadata for inference classes on project '{project_id}': {e}")

            if not classes_meta and os.path.exists(training_meta_path):
                try:
                    with open(training_meta_path, "r", encoding="utf-8") as f:
                        t_meta = json.load(f)
                    for idx, c_name in enumerate(t_meta.get("classes", [])):
                        classes_meta.append({
                            "id": f"class-{idx+1}",
                            "name": c_name,
                            "color": CLASS_COLORS[idx % len(CLASS_COLORS)]
                        })
                except Exception as e:
                    logger.warning(f"Failed to read training metadata for inference classes on project '{project_id}': {e}")

            cache_entry = {
                "model": model,
                "classes": classes_meta,
                "mtime": current_mtime
            }
            self._model_cache[project_id] = cache_entry
            return cache_entry

    def preprocess_image_bytes(self, image_bytes: bytes):
        import numpy as np
        import tensorflow as tf

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img = img.resize((224, 224))
            arr = np.array(img, dtype=np.float32)
            # MobileNetV2 preprocessing (-1 to 1 scaling)
            arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
            batch = np.expand_dims(arr, axis=0)
            return batch
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid or corrupted image data: {str(e)}")

    def predict_bytes(self, project_id: str, image_bytes: bytes) -> Dict[str, Any]:
        import numpy as np

        model_entry = self._get_or_load_model(project_id)
        model = model_entry["model"]
        classes_info = model_entry["classes"]

        if not classes_info:
            raise HTTPException(status_code=400, detail="No enabled classes found for inference.")

        # Measure prediction latency
        t_start = time.perf_counter()
        batch = self.preprocess_image_bytes(image_bytes)

        try:
            raw_probs = model.predict(batch, verbose=0)[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TensorFlow model prediction failed: {str(e)}")

        t_end = time.perf_counter()
        latency_ms = round((t_end - t_start) * 1000, 2)
        formatted_time = f"{latency_ms:.1f}ms" if latency_ms < 1000 else f"{latency_ms/1000:.2f}s"

        top_idx = int(np.argmax(raw_probs))

        predictions = []
        for idx, cls in enumerate(classes_info):
            prob = float(raw_probs[idx]) if idx < len(raw_probs) else 0.0
            conf_pct = round(prob * 100, 1)
            predictions.append({
                "class_id": cls["id"],
                "class_name": cls["name"],
                "confidence": conf_pct,
                "is_highest": idx == top_idx,
                "color": cls["color"]
            })

        top_class = predictions[top_idx] if top_idx < len(predictions) else predictions[0]

        return {
            "predicted_class_id": top_class["class_id"],
            "predicted_class_name": top_class["class_name"],
            "confidence": top_class["confidence"],
            "prediction_time_ms": latency_ms,
            "formatted_prediction_time": formatted_time,
            "predictions": predictions
        }

    def predict_base64(self, project_id: str, base64_str: str) -> Dict[str, Any]:
        if not base64_str:
            raise HTTPException(status_code=400, detail="Image data string is empty.")

        try:
            if "," in base64_str:
                base64_str = base64_str.split(",", 1)[1]
            image_bytes = base64.b64decode(base64_str)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode base64 image data: {str(e)}")

        return self.predict_bytes(project_id, image_bytes)
