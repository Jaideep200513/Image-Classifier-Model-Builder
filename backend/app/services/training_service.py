import os
import json
import time
import threading
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from PIL import Image

logger = logging.getLogger(__name__)

class TrainingService:
    def __init__(self, uploads_dir: str):
        self.uploads_dir = os.path.abspath(uploads_dir)
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _get_project_dir(self, project_id: str) -> str:
        return os.path.join(self.uploads_dir, project_id)

    def _get_metadata_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "metadata.json")

    def _get_training_meta_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "training_metadata.json")

    def _get_model_dir(self, project_id: str) -> str:
        model_dir = os.path.join(self._get_project_dir(project_id), "models")
        os.makedirs(model_dir, exist_ok=True)
        return model_dir

    def clear_job(self, project_id: str):
        with self._lock:
            if project_id in self._jobs:
                del self._jobs[project_id]

    def format_duration(self, seconds: float) -> str:
        sec = int(round(seconds))
        if sec < 60:
            return f"{sec}s"
        mins = sec // 60
        rem_sec = sec % 60
        return f"{mins}m {rem_sec}s"

    def validate_dataset(self, project_id: str) -> Dict[str, Any]:
        """Validates that the project has >= 2 enabled classes and each enabled class has >= 10 valid images."""
        meta_path = self._get_metadata_path(project_id)
        if not os.path.exists(meta_path):
            raise HTTPException(status_code=404, detail="Project metadata not found.")

        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        classes = metadata.get("classes", [])
        enabled_classes = [c for c in classes if not c.get("disabled", False)]

        if len(enabled_classes) < 2:
            raise HTTPException(
                status_code=400,
                detail=f"At least 2 enabled classes are required for training (currently {len(enabled_classes)} enabled)."
            )

        project_dir = self._get_project_dir(project_id)
        allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
        validated_classes = []

        for cls in enabled_classes:
            class_dir = os.path.join(project_dir, cls["name"])
            if not os.path.exists(class_dir):
                image_count = 0
            else:
                files = [f for f in os.listdir(class_dir) if os.path.splitext(f)[1].lower() in allowed_exts]
                image_count = len(files)

            if image_count < 10:
                raise HTTPException(
                    status_code=400,
                    detail=f"Class '{cls['name']}' requires at least 10 images (currently has {image_count})."
                )

            validated_classes.append({
                "id": cls["id"],
                "name": cls["name"],
                "directory": class_dir,
                "image_count": image_count
            })

        return {
            "enabled_classes": validated_classes,
            "project_name": metadata.get("name", "Image Project")
        }

    def get_status(self, project_id: str) -> Dict[str, Any]:
        with self._lock:
            if project_id in self._jobs:
                job = self._jobs[project_id]
                # Update elapsed time if training is ongoing
                if job["status"] == "training" and job.get("start_time"):
                    elapsed = time.time() - job["start_time"]
                    job["elapsed_time"] = round(elapsed, 1)
                    job["formatted_elapsed_time"] = self.format_duration(elapsed)
                return job.copy()

        # Check saved training metadata if no active job in memory
        training_meta_path = self._get_training_meta_path(project_id)
        if os.path.exists(training_meta_path):
            try:
                with open(training_meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                return {
                    "status": "completed",
                    "progress": 100.0,
                    "current_epoch": meta.get("config", {}).get("epochs", 50),
                    "total_epochs": meta.get("config", {}).get("epochs", 50),
                    "elapsed_time": meta.get("duration_seconds", 0),
                    "formatted_elapsed_time": meta.get("formatted_duration", "0s"),
                    "metrics": meta.get("metrics"),
                    "error": None,
                    "has_trained_model": True,
                    "trained_at": meta.get("trained_at")
                }
            except Exception:
                pass

        return {
            "status": "idle",
            "progress": 0.0,
            "current_epoch": 0,
            "total_epochs": 50,
            "elapsed_time": 0.0,
            "formatted_elapsed_time": "0s",
            "metrics": None,
            "error": None,
            "has_trained_model": False,
            "trained_at": None
        }

    def cancel_training(self, project_id: str) -> Dict[str, Any]:
        with self._lock:
            if project_id in self._jobs:
                job = self._jobs[project_id]
                if job["status"] == "training":
                    job["cancel_requested"] = True
                    job["status"] = "idle"
                    job["progress"] = 0.0
                    job["error"] = "Training cancelled by user."
                return job.copy()
        return self.get_status(project_id)

    def get_under_the_hood_analytics(self, project_id: str) -> dict:
        with self._lock:
            if project_id in self._jobs and "under_the_hood" in self._jobs[project_id]:
                return self._jobs[project_id]["under_the_hood"]

        training_meta_path = self._get_training_meta_path(project_id)
        if os.path.exists(training_meta_path):
            try:
                with open(training_meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                if "under_the_hood" in meta:
                    return meta["under_the_hood"]
            except Exception:
                pass

        raise HTTPException(status_code=404, detail="Under the Hood analytics not available for this project.")

    def start_training(self, project_id: str, epochs: int = 50, batch_size: int = 16, learning_rate: float = 0.001) -> Dict[str, Any]:
        # Validate dataset first
        validation_info = self.validate_dataset(project_id)
        enabled_classes = validation_info["enabled_classes"]

        with self._lock:
            if project_id in self._jobs and self._jobs[project_id]["status"] == "training":
                raise HTTPException(status_code=400, detail="Training is already in progress for this project.")

            job_state = {
                "status": "training",
                "progress": 0.0,
                "current_epoch": 0,
                "total_epochs": epochs,
                "elapsed_time": 0.0,
                "formatted_elapsed_time": "0s",
                "start_time": time.time(),
                "metrics": None,
                "error": None,
                "cancel_requested": False,
                "has_trained_model": False,
                "trained_at": None,
                "config": {
                    "epochs": epochs,
                    "batchSize": batch_size,
                    "learningRate": learning_rate
                }
            }
            self._jobs[project_id] = job_state

        # Run training in background thread
        thread = threading.Thread(
            target=self._run_tensorflow_training,
            args=(project_id, enabled_classes, epochs, batch_size, learning_rate),
            daemon=True
        )
        thread.start()

        return job_state

    def _run_tensorflow_training(self, project_id: str, enabled_classes: List[Dict[str, Any]], epochs: int, batch_size: int, learning_rate: float):
        start_time = time.time()
        try:
            import numpy as np
            import tensorflow as tf

            # 1. Load & preprocess image dataset
            image_paths = []
            labels = []
            allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}

            for label_idx, cls_info in enumerate(enabled_classes):
                c_dir = cls_info["directory"]
                if os.path.exists(c_dir):
                    for f in sorted(os.listdir(c_dir)):
                        if os.path.splitext(f)[1].lower() in allowed_exts:
                            image_paths.append(os.path.join(c_dir, f))
                            labels.append(label_idx)

            X_data = []
            y_data = []

            for img_path, label in zip(image_paths, labels):
                try:
                    img = Image.open(img_path).convert("RGB")
                    img = img.resize((224, 224))
                    arr = np.array(img, dtype=np.float32)
                    # Preprocess for MobileNetV2 (-1 to 1 scaling)
                    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
                    X_data.append(arr)
                    y_data.append(label)
                except Exception as e:
                    logger.warning(f"Skipping corrupt image {img_path}: {e}")

            if len(X_data) < 2:
                raise ValueError("Insufficient valid images could be loaded for training.")

            X = np.array(X_data, dtype=np.float32)
            y = np.array(y_data, dtype=np.int32)

            # Shuffle dataset
            indices = np.arange(len(X))
            np.random.shuffle(indices)
            X = X[indices]
            y = y[indices]

            # Train/validation split (80/20)
            split_idx = max(1, int(len(X) * 0.8))
            if split_idx >= len(X):
                split_idx = len(X) - 1

            X_train, X_val = X[:split_idx], X[split_idx:]
            y_train, y_val = y[:split_idx], y[split_idx:]

            num_classes = len(enabled_classes)

            # 2. Lightweight Data Augmentation layer
            data_augmentation = tf.keras.Sequential([
                tf.keras.layers.RandomFlip("horizontal"),
                tf.keras.layers.RandomRotation(0.1),
                tf.keras.layers.RandomZoom(0.1),
            ])

            # 3. MobileNetV2 Transfer Learning Architecture
            base_model = tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights="imagenet"
            )
            base_model.trainable = False  # Freeze backbone

            inputs = tf.keras.Input(shape=(224, 224, 3))
            x = data_augmentation(inputs)
            x = base_model(x, training=False)
            x = tf.keras.layers.GlobalAveragePooling2D()(x)
            x = tf.keras.layers.Dropout(0.2)(x)
            outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

            model = tf.keras.Model(inputs, outputs)

            # 4. Compile Model
            model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
                loss="sparse_categorical_crossentropy",
                metrics=["accuracy"]
            )

            # 5. Keras Custom Callback for live progress tracking
            service_ref = self
            class ProgressCallback(tf.keras.callbacks.Callback):
                def on_epoch_begin(self, epoch, logs=None):
                    with service_ref._lock:
                        if project_id in service_ref._jobs:
                            job = service_ref._jobs[project_id]
                            if job.get("cancel_requested"):
                                self.model.stop_training = True
                                return
                            elapsed = time.time() - start_time
                            job["current_epoch"] = epoch + 1
                            job["elapsed_time"] = round(elapsed, 1)
                            job["formatted_elapsed_time"] = service_ref.format_duration(elapsed)

                def on_epoch_end(self, epoch, logs=None):
                    logs = logs or {}
                    with service_ref._lock:
                        if project_id in service_ref._jobs:
                            job = service_ref._jobs[project_id]
                            if job.get("cancel_requested"):
                                self.model.stop_training = True
                                return
                            elapsed = time.time() - start_time
                            job["current_epoch"] = epoch + 1
                            job["progress"] = round(((epoch + 1) / epochs) * 100, 1)
                            job["elapsed_time"] = round(elapsed, 1)
                            job["formatted_elapsed_time"] = service_ref.format_duration(elapsed)
                            job["metrics"] = {
                                "train_accuracy": round(float(logs.get("accuracy", 0.0)), 4),
                                "val_accuracy": round(float(logs.get("val_accuracy", 0.0)), 4),
                                "train_loss": round(float(logs.get("loss", 0.0)), 4),
                                "val_loss": round(float(logs.get("val_loss", 0.0)), 4),
                            }

            # 6. Fit Model
            history = model.fit(
                X_train, y_train,
                batch_size=min(batch_size, len(X_train)),
                epochs=epochs,
                validation_data=(X_val, y_val),
                callbacks=[ProgressCallback()],
                verbose=0
            )

            with self._lock:
                if project_id in self._jobs and self._jobs[project_id].get("cancel_requested"):
                    return

            end_time = time.time()
            total_duration = round(end_time - start_time, 2)
            formatted_dur = self.format_duration(total_duration)

            # Final metrics
            final_acc = float(history.history.get("accuracy", [0])[-1])
            final_val_acc = float(history.history.get("val_accuracy", [0])[-1])
            final_loss = float(history.history.get("loss", [0])[-1])
            final_val_loss = float(history.history.get("val_loss", [0])[-1])

            metrics = {
                "train_accuracy": round(final_acc, 4),
                "val_accuracy": round(final_val_acc, 4),
                "train_loss": round(final_loss, 4),
                "val_loss": round(final_val_loss, 4),
                "duration_seconds": total_duration,
                "formatted_duration": formatted_dur
            }

            # Compute Under the Hood analytics (Validation predictions, confusion matrix, epoch histories)
            val_preds = model.predict(X_val)
            val_pred_labels = np.argmax(val_preds, axis=1)

            num_classes = len(enabled_classes)
            class_names = [c["name"] for c in enabled_classes]
            conf_matrix = [[0] * num_classes for _ in range(num_classes)]

            for true_lbl, pred_lbl in zip(y_val, val_pred_labels):
                conf_matrix[int(true_lbl)][int(pred_lbl)] += 1

            accuracy_per_class = []
            for idx, cname in enumerate(class_names):
                total_samples = sum(conf_matrix[idx])
                correct_samples = conf_matrix[idx][idx]
                acc = round(correct_samples / total_samples, 2) if total_samples > 0 else 1.00
                accuracy_per_class.append({
                    "class_name": cname,
                    "accuracy": acc,
                    "sample_count": total_samples
                })

            acc_list = history.history.get("accuracy", [])
            val_acc_list = history.history.get("val_accuracy", [])
            loss_list = history.history.get("loss", [])
            val_loss_list = history.history.get("val_loss", [])

            accuracy_per_epoch = []
            loss_per_epoch = []

            for ep_idx in range(len(acc_list)):
                accuracy_per_epoch.append({
                    "epoch": ep_idx + 1,
                    "accuracy": round(float(acc_list[ep_idx]), 4),
                    "val_accuracy": round(float(val_acc_list[ep_idx]), 4) if ep_idx < len(val_acc_list) else round(float(acc_list[ep_idx]), 4)
                })
                loss_per_epoch.append({
                    "epoch": ep_idx + 1,
                    "loss": round(float(loss_list[ep_idx]), 4),
                    "val_loss": round(float(val_loss_list[ep_idx]), 4) if ep_idx < len(val_loss_list) else round(float(loss_list[ep_idx]), 4)
                })

            under_the_hood = {
                "epochs": epochs,
                "accuracy_per_epoch": accuracy_per_epoch,
                "loss_per_epoch": loss_per_epoch,
                "accuracy_per_class": accuracy_per_class,
                "confusion_matrix": {
                    "classes": class_names,
                    "matrix": conf_matrix
                }
            }

            # 7. Save Model & Metadata
            model_dir = self._get_model_dir(project_id)
            model_save_path = os.path.join(model_dir, "model.keras")
            model.save(model_save_path)

            training_meta = {
                "trained_at": datetime.now().isoformat(),
                "duration_seconds": total_duration,
                "formatted_duration": formatted_dur,
                "metrics": metrics,
                "under_the_hood": under_the_hood,
                "config": {
                    "epochs": epochs,
                    "batchSize": batch_size,
                    "learningRate": learning_rate
                },
                "classes": [c["name"] for c in enabled_classes]
            }

            with open(self._get_training_meta_path(project_id), "w", encoding="utf-8") as f:
                json.dump(training_meta, f, indent=2)

            # 8. Update job state to completed
            with self._lock:
                if project_id in self._jobs:
                    job = self._jobs[project_id]
                    job["status"] = "completed"
                    job["progress"] = 100.0
                    job["current_epoch"] = epochs
                    job["elapsed_time"] = total_duration
                    job["formatted_elapsed_time"] = formatted_dur
                    job["metrics"] = metrics
                    job["under_the_hood"] = under_the_hood
                    job["has_trained_model"] = True
                    job["trained_at"] = training_meta["trained_at"]

        except Exception as e:
            logger.error(f"Training failed for project {project_id}: {e}")
            with self._lock:
                if project_id in self._jobs:
                    job = self._jobs[project_id]
                    job["status"] = "error"
                    job["error"] = str(e)
