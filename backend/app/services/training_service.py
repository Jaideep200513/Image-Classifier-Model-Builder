import os
import json
import time
import threading
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from PIL import Image

from app.services.dataset_service import sanitize_filename

logger = logging.getLogger(__name__)

MAX_TRAINING_TIMEOUT_SECONDS = int(os.environ.get("MAX_TRAINING_TIMEOUT_SECONDS", "3600"))  # Default 1 hour max training duration

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
            class_dir = os.path.join(project_dir, sanitize_filename(cls["name"]))
            if not os.path.exists(class_dir):
                image_count = 0
            else:
                files = [f for f in os.listdir(class_dir) if os.path.splitext(f)[1].lower() in allowed_exts]
                image_count = len(files)

            if image_count < 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Class '{cls['name']}' requires at least 1 image (currently has {image_count})."
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
            except Exception as e:
                logger.warning(f"Failed to read training metadata for project '{project_id}': {e}")

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
            except Exception as e:
                logger.warning(f"Failed to read under-the-hood analytics from metadata for project '{project_id}': {e}")

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

            # 1. Collect valid image paths and labels
            valid_paths = []
            valid_labels = []
            allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}

            for label_idx, cls_info in enumerate(enabled_classes):
                c_dir = cls_info["directory"]
                if os.path.exists(c_dir):
                    for f in sorted(os.listdir(c_dir)):
                        if os.path.splitext(f)[1].lower() in allowed_exts:
                            full_path = os.path.join(c_dir, f)
                            try:
                                with Image.open(full_path) as img:
                                    img.verify()
                                valid_paths.append(full_path)
                                valid_labels.append(label_idx)
                            except Exception as e:
                                logger.warning(f"Skipping corrupt image {full_path}: {e}")

            if len(valid_paths) < 2:
                raise ValueError("Insufficient valid images could be loaded for training.")

            # Shuffle dataset file paths and labels
            indices = np.arange(len(valid_paths))
            np.random.shuffle(indices)
            shuffled_paths = [valid_paths[i] for i in indices]
            shuffled_labels = [valid_labels[i] for i in indices]

            # Train/validation split (80/20)
            split_idx = max(1, int(len(shuffled_paths) * 0.8))
            if split_idx >= len(shuffled_paths):
                split_idx = len(shuffled_paths) - 1

            train_paths, val_paths = shuffled_paths[:split_idx], shuffled_paths[split_idx:]
            train_labels, val_labels = shuffled_labels[:split_idx], shuffled_labels[split_idx:]

            # Batch image dataset loader to prevent loading full dataset into RAM
            def _load_and_preprocess_single_image(path_tensor):
                path_str = path_tensor.numpy().decode("utf-8")
                with Image.open(path_str) as img:
                    img = img.convert("RGB").resize((224, 224))
                    arr = np.array(img, dtype=np.float32)
                    return tf.keras.applications.mobilenet_v2.preprocess_input(arr)

            def load_image_tf(path, label):
                img = tf.py_function(
                    func=_load_and_preprocess_single_image,
                    inp=[path],
                    Tout=tf.float32
                )
                img.set_shape([224, 224, 3])
                return img, label

            effective_batch_size = max(1, min(batch_size, len(train_paths)))

            train_ds_raw = tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
            train_ds_raw = train_ds_raw.map(load_image_tf, num_parallel_calls=tf.data.AUTOTUNE)
            train_ds_batched = train_ds_raw.batch(effective_batch_size).prefetch(tf.data.AUTOTUNE)

            val_ds_raw = tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
            val_ds_raw = val_ds_raw.map(load_image_tf, num_parallel_calls=tf.data.AUTOTUNE)
            val_ds_batched = val_ds_raw.batch(effective_batch_size).prefetch(tf.data.AUTOTUNE)

            num_classes = len(enabled_classes)

            # 2. Base Backbone Architecture (MobileNetV2 pre-trained on ImageNet)
            base_model = tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights="imagenet"
            )
            base_model.trainable = False  # Keep backbone frozen to preserve ImageNet features

            # Feature extractor wrapper
            feature_extractor = tf.keras.Sequential([
                base_model,
                tf.keras.layers.GlobalAveragePooling2D()
            ])

            logger.info(f"Pre-extracting bottleneck features for project {project_id}...")
            train_features = feature_extractor.predict(train_ds_batched, verbose=0)
            val_features = feature_extractor.predict(val_ds_batched, verbose=0)

            # 3. Teachable Machine Classifier Head
            head_inputs = tf.keras.Input(shape=(1280,))
            x = tf.keras.layers.Dense(100, activation="relu")(head_inputs)
            x = tf.keras.layers.Dropout(0.1)(x)
            head_outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

            head_model = tf.keras.Model(head_inputs, head_outputs)
            head_model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
                loss="sparse_categorical_crossentropy",
                metrics=["accuracy"]
            )

            # 4. Custom Progress Callback
            service_ref = self
            history_acc, history_val_acc = [], []
            history_loss, history_val_loss = [], []

            class ProgressCallback(tf.keras.callbacks.Callback):
                def on_epoch_begin(self, epoch, logs=None):
                    elapsed = time.time() - start_time
                    if elapsed > MAX_TRAINING_TIMEOUT_SECONDS:
                        self.model.stop_training = True
                        with service_ref._lock:
                            if project_id in service_ref._jobs:
                                job = service_ref._jobs[project_id]
                                job["status"] = "error"
                                job["error"] = f"Training timed out after exceeding max duration of {MAX_TRAINING_TIMEOUT_SECONDS}s."
                        return

                    with service_ref._lock:
                        if project_id in service_ref._jobs:
                            job = service_ref._jobs[project_id]
                            if job.get("cancel_requested"):
                                self.model.stop_training = True
                                return
                            job["current_epoch"] = epoch + 1
                            job["elapsed_time"] = round(elapsed, 1)
                            job["formatted_elapsed_time"] = service_ref.format_duration(elapsed)

                def on_epoch_end(self, epoch, logs=None):
                    elapsed = time.time() - start_time
                    if elapsed > MAX_TRAINING_TIMEOUT_SECONDS:
                        self.model.stop_training = True
                        with service_ref._lock:
                            if project_id in service_ref._jobs:
                                job = service_ref._jobs[project_id]
                                job["status"] = "error"
                                job["error"] = f"Training timed out after exceeding max duration of {MAX_TRAINING_TIMEOUT_SECONDS}s."
                        return

                    logs = logs or {}
                    history_acc.append(float(logs.get("accuracy", 0.0)))
                    history_val_acc.append(float(logs.get("val_accuracy", 0.0)))
                    history_loss.append(float(logs.get("loss", 0.0)))
                    history_val_loss.append(float(logs.get("val_loss", 0.0)))

                    with service_ref._lock:
                        if project_id in service_ref._jobs:
                            job = service_ref._jobs[project_id]
                            if job.get("cancel_requested"):
                                self.model.stop_training = True
                                return
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

            # 5. Fit Classifier Head on pre-extracted bottleneck features
            np_train_labels = np.array(train_labels, dtype=np.int32)
            np_val_labels = np.array(val_labels, dtype=np.int32)

            history = head_model.fit(
                train_features, np_train_labels,
                batch_size=effective_batch_size,
                epochs=epochs,
                validation_data=(val_features, np_val_labels),
                callbacks=[ProgressCallback()],
                verbose=0
            )

            # Reconstruct complete end-to-end Keras model for inference & export
            full_inputs = tf.keras.Input(shape=(224, 224, 3))
            feat_x = base_model(full_inputs, training=False)
            gap_x = tf.keras.layers.GlobalAveragePooling2D()(feat_x)
            full_outputs = head_model(gap_x)

            model = tf.keras.Model(inputs=full_inputs, outputs=full_outputs)

            history_dict = {
                "accuracy": history_acc,
                "val_accuracy": history_val_acc,
                "loss": history_loss,
                "val_loss": history_val_loss
            }

            with self._lock:
                if project_id in self._jobs:
                    job = self._jobs[project_id]
                    if job.get("cancel_requested") or job.get("status") == "error":
                        return

            end_time = time.time()
            total_duration = round(end_time - start_time, 2)
            formatted_dur = self.format_duration(total_duration)

            # Final metrics
            final_acc = float(history_dict.get("accuracy", [0])[-1])
            final_val_acc = float(history_dict.get("val_accuracy", [0])[-1])
            final_loss = float(history_dict.get("loss", [0])[-1])
            final_val_loss = float(history_dict.get("val_loss", [0])[-1])

            metrics = {
                "train_accuracy": round(final_acc, 4),
                "val_accuracy": round(final_val_acc, 4),
                "train_loss": round(final_loss, 4),
                "val_loss": round(final_val_loss, 4),
                "duration_seconds": total_duration,
                "formatted_duration": formatted_dur
            }

            # Compute Under the Hood analytics (Validation predictions, confusion matrix, epoch histories)
            val_preds = model.predict(val_ds_batched, verbose=0)
            val_pred_labels = np.argmax(val_preds, axis=1)

            num_classes = len(enabled_classes)
            class_names = [c["name"] for c in enabled_classes]
            conf_matrix = [[0] * num_classes for _ in range(num_classes)]

            for true_lbl, pred_lbl in zip(val_labels, val_pred_labels):
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

            acc_list = history_dict.get("accuracy", [])
            val_acc_list = history_dict.get("val_accuracy", [])
            loss_list = history_dict.get("loss", [])
            val_loss_list = history_dict.get("val_loss", [])

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
        finally:
            try:
                import gc
                import tensorflow as tf
                tf.keras.backend.clear_session()
                gc.collect()
            except Exception as e:
                logger.warning(f"Error during post-training session cleanup for project {project_id}: {e}")
