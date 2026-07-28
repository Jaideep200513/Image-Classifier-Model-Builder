import os
import shutil
import json
import uuid
import base64
from datetime import datetime
from typing import List, Optional
from fastapi import UploadFile, HTTPException

CLASS_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
]

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

class DatasetService:
    def __init__(self, uploads_dir: str):
        self.uploads_dir = os.path.abspath(uploads_dir)
        os.makedirs(self.uploads_dir, exist_ok=True)

    def _get_project_dir(self, project_id: str) -> str:
        project_dir = os.path.join(self.uploads_dir, project_id)
        os.makedirs(project_dir, exist_ok=True)
        return project_dir

    def _get_meta_path(self, project_id: str) -> str:
        return os.path.join(self._get_project_dir(project_id), "metadata.json")

    def _load_metadata(self, project_id: str) -> dict:
        meta_path = self._get_meta_path(project_id)
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        # Default initial project state with Class 1 & Class 2
        default_data = {
            "id": project_id,
            "name": "Image Project",
            "type": "image",
            "description": "Custom Image Classification Project",
            "created_at": datetime.now().isoformat(),
            "classes": [
                {
                    "id": "class-1",
                    "name": "Class 1",
                    "color": CLASS_COLORS[0],
                    "disabled": False,
                    "images": []
                },
                {
                    "id": "class-2",
                    "name": "Class 2",
                    "color": CLASS_COLORS[1],
                    "disabled": False,
                    "images": []
                }
            ]
        }
        self._save_metadata(project_id, default_data)
        for cls in default_data["classes"]:
            os.makedirs(os.path.join(self._get_project_dir(project_id), cls["name"]), exist_ok=True)
        return default_data

    def _save_metadata(self, project_id: str, data: dict):
        meta_path = self._get_meta_path(project_id)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def get_project(self, project_id: str) -> dict:
        project = self._load_metadata(project_id)
        project_dir = self._get_project_dir(project_id)

        for cls in project["classes"]:
            class_dir = os.path.join(project_dir, cls["name"])
            os.makedirs(class_dir, exist_ok=True)

            existing_images = []
            if os.path.exists(class_dir):
                files = sorted(os.listdir(class_dir))
                known_imgs = {img["filename"]: img for img in cls.get("images", [])}

                for f in files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in ALLOWED_EXTENSIONS:
                        if f in known_imgs:
                            existing_images.append(known_imgs[f])
                        else:
                            img_id = f"img-{uuid.uuid4().hex[:8]}"
                            img_url = f"/uploads/{project_id}/{cls['name']}/{f}"
                            existing_images.append({
                                "id": img_id,
                                "filename": f,
                                "url": img_url,
                                "class_id": cls["id"],
                                "created_at": datetime.now().isoformat()
                            })
            cls["images"] = existing_images
            cls["imageCount"] = len(existing_images)

        self._save_metadata(project_id, project)
        return project

    def create_project(self, name: str = "Image Project", type: str = "image", description: str = "") -> dict:
        project_id = f"proj-{uuid.uuid4().hex[:8]}"
        project_data = {
            "id": project_id,
            "name": name,
            "type": type,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "classes": [
                {
                    "id": f"class-{uuid.uuid4().hex[:6]}",
                    "name": "Class 1",
                    "color": CLASS_COLORS[0],
                    "disabled": False,
                    "images": []
                },
                {
                    "id": f"class-{uuid.uuid4().hex[:6]}",
                    "name": "Class 2",
                    "color": CLASS_COLORS[1],
                    "disabled": False,
                    "images": []
                }
            ]
        }
        self._save_metadata(project_id, project_data)
        project_dir = self._get_project_dir(project_id)
        for cls in project_data["classes"]:
            os.makedirs(os.path.join(project_dir, cls["name"]), exist_ok=True)
        return self.get_project(project_id)

    def reset_project(self, project_id: str) -> dict:
        project_dir = os.path.join(self.uploads_dir, project_id)
        if os.path.exists(project_dir):
            shutil.rmtree(project_dir, ignore_errors=True)

        default_data = {
            "id": project_id,
            "name": "Image Project",
            "type": "image",
            "description": "Custom Image Classification Project",
            "created_at": datetime.now().isoformat(),
            "classes": [
                {
                    "id": f"class-{uuid.uuid4().hex[:6]}",
                    "name": "Class 1",
                    "color": CLASS_COLORS[0],
                    "disabled": False,
                    "images": []
                },
                {
                    "id": f"class-{uuid.uuid4().hex[:6]}",
                    "name": "Class 2",
                    "color": CLASS_COLORS[1],
                    "disabled": False,
                    "images": []
                }
            ]
        }
        self._save_metadata(project_id, default_data)
        p_dir = self._get_project_dir(project_id)
        for cls in default_data["classes"]:
            os.makedirs(os.path.join(p_dir, cls["name"]), exist_ok=True)
        return default_data


    def add_class(self, project_id: str, name: str) -> dict:
        clean_name = name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Class name cannot be empty.")

        project = self.get_project(project_id)
        for existing in project["classes"]:
            if existing["name"].lower() == clean_name.lower():
                raise HTTPException(status_code=400, detail=f"A class named '{clean_name}' already exists in this project.")

        class_count = len(project["classes"])
        color = CLASS_COLORS[class_count % len(CLASS_COLORS)]
        class_id = f"class-{uuid.uuid4().hex[:6]}"

        new_class = {
            "id": class_id,
            "name": clean_name,
            "color": color,
            "disabled": False,
            "imageCount": 0,
            "images": []
        }

        project["classes"].append(new_class)
        class_dir = os.path.join(self._get_project_dir(project_id), clean_name)
        os.makedirs(class_dir, exist_ok=True)

        self._save_metadata(project_id, project)
        return new_class

    def update_class(self, class_id: str, name: Optional[str] = None, disabled: Optional[bool] = None) -> dict:
        target_project_id = None
        target_class = None
        project = None

        for proj_id in os.listdir(self.uploads_dir):
            if os.path.isdir(os.path.join(self.uploads_dir, proj_id)):
                p = self.get_project(proj_id)
                for cls in p["classes"]:
                    if cls["id"] == class_id:
                        target_project_id = proj_id
                        target_class = cls
                        project = p
                        break
                if target_class:
                    break

        if not target_class or not project or not target_project_id:
            raise HTTPException(status_code=404, detail="Class not found")

        old_name = target_class["name"]

        if name is not None and name.strip() and name.strip() != old_name:
            new_name = name.strip()

            for existing in project["classes"]:
                if existing["id"] != class_id and existing["name"].lower() == new_name.lower():
                    raise HTTPException(status_code=400, detail=f"A class named '{new_name}' already exists in this project.")

            old_dir = os.path.join(self._get_project_dir(target_project_id), old_name)
            new_dir = os.path.join(self._get_project_dir(target_project_id), new_name)

            if os.path.exists(old_dir):
                shutil.move(old_dir, new_dir)
            else:
                os.makedirs(new_dir, exist_ok=True)

            target_class["name"] = new_name
            for img in target_class["images"]:
                img["url"] = f"/uploads/{target_project_id}/{new_name}/{img['filename']}"

        if disabled is not None:
            target_class["disabled"] = disabled

        self._save_metadata(target_project_id, project)
        return target_class

    def get_project_stats(self, project_id: str) -> dict:
        project = self.get_project(project_id)
        total_images = sum(cls.get("imageCount", len(cls.get("images", []))) for cls in project["classes"])

        training_meta_path = os.path.join(self._get_project_dir(project_id), "training_metadata.json")
        model_path = os.path.join(self._get_project_dir(project_id), "models", "model.keras")

        has_model = os.path.exists(model_path)
        trained_at = None
        if os.path.exists(training_meta_path):
            try:
                with open(training_meta_path, "r", encoding="utf-8") as f:
                    t_meta = json.load(f)
                trained_at = t_meta.get("trained_at")
            except Exception:
                pass

        return {
            "id": project["id"],
            "name": project["name"],
            "description": project.get("description", ""),
            "classes_count": len(project["classes"]),
            "images_count": total_images,
            "trained_at": trained_at,
            "has_model": has_model
        }

    def update_project(self, project_id: str, name: str, description: Optional[str] = None) -> dict:
        clean_name = name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Project name cannot be empty.")

        project = self.get_project(project_id)
        project["name"] = clean_name
        if description is not None:
            project["description"] = description

        self._save_metadata(project_id, project)
        return project

    def duplicate_project(self, project_id: str) -> dict:
        source_project = self.get_project(project_id)
        new_id = f"project-{uuid.uuid4().hex[:8]}"
        new_dir = self._get_project_dir(new_id)
        os.makedirs(new_dir, exist_ok=True)

        source_dir = self._get_project_dir(project_id)

        # Copy image class folders
        for cls in source_project["classes"]:
            cls_name = cls["name"]
            src_cls_dir = os.path.join(source_dir, cls_name)
            dst_cls_dir = os.path.join(new_dir, cls_name)
            if os.path.exists(src_cls_dir):
                shutil.copytree(src_cls_dir, dst_cls_dir)
            else:
                os.makedirs(dst_cls_dir, exist_ok=True)

        # Duplicate metadata structure
        duplicated_project = json.loads(json.dumps(source_project))
        duplicated_project["id"] = new_id
        duplicated_project["name"] = f"{source_project['name']} (Copy)"
        duplicated_project["created_at"] = datetime.now().isoformat()

        # Update image URLs to point to new project ID
        for cls in duplicated_project["classes"]:
            for img in cls.get("images", []):
                img["url"] = f"/uploads/{new_id}/{cls['name']}/{img['filename']}"

        self._save_metadata(new_id, duplicated_project)
        return duplicated_project

    def delete_project(self, project_id: str) -> dict:
        project_dir = self._get_project_dir(project_id)
        if os.path.exists(project_dir):
            shutil.rmtree(project_dir, ignore_errors=True)
        return {"success": True, "message": f"Project '{project_id}' deleted successfully."}

    def delete_class(self, class_id: str) -> dict:
        target_project_id = None
        target_class = None
        project = None

        for proj_id in os.listdir(self.uploads_dir):
            if os.path.isdir(os.path.join(self.uploads_dir, proj_id)):
                p = self.get_project(proj_id)
                for cls in p["classes"]:
                    if cls["id"] == class_id:
                        target_project_id = proj_id
                        target_class = cls
                        project = p
                        break
                if target_class:
                    break

        if not target_class or not project or not target_project_id:
            raise HTTPException(status_code=404, detail="Class not found")

        class_dir = os.path.join(self._get_project_dir(target_project_id), target_class["name"])
        if os.path.exists(class_dir):
            shutil.rmtree(class_dir, ignore_errors=True)

        project["classes"] = [c for c in project["classes"] if c["id"] != class_id]
        self._save_metadata(target_project_id, project)
        return {"success": True, "class_id": class_id}

    async def upload_images(self, class_id: str, files: List[UploadFile]) -> List[dict]:
        target_project_id = None
        target_class = None
        project = None

        for proj_id in os.listdir(self.uploads_dir):
            if os.path.isdir(os.path.join(self.uploads_dir, proj_id)):
                p = self.get_project(proj_id)
                for cls in p["classes"]:
                    if cls["id"] == class_id:
                        target_project_id = proj_id
                        target_class = cls
                        project = p
                        break
                if target_class:
                    break

        if not target_class or not project or not target_project_id:
            raise HTTPException(status_code=404, detail="Class not found")

        class_dir = os.path.join(self._get_project_dir(target_project_id), target_class["name"])
        os.makedirs(class_dir, exist_ok=True)

        saved_items = []
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"Unsupported file format: {file.filename}. Allowed: JPG, PNG, WEBP")

            img_id = f"img-{uuid.uuid4().hex[:8]}"
            safe_filename = f"{img_id}{ext}"
            file_path = os.path.join(class_dir, safe_filename)

            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            item = {
                "id": img_id,
                "filename": safe_filename,
                "url": f"/uploads/{target_project_id}/{target_class['name']}/{safe_filename}",
                "class_id": class_id,
                "created_at": datetime.now().isoformat()
            }
            target_class["images"].append(item)
            saved_items.append(item)

        target_class["imageCount"] = len(target_class["images"])
        self._save_metadata(target_project_id, project)
        return saved_items

    def capture_image(self, class_id: str, base64_data: str) -> dict:
        target_project_id = None
        target_class = None
        project = None

        for proj_id in os.listdir(self.uploads_dir):
            if os.path.isdir(os.path.join(self.uploads_dir, proj_id)):
                p = self.get_project(proj_id)
                for cls in p["classes"]:
                    if cls["id"] == class_id:
                        target_project_id = proj_id
                        target_class = cls
                        project = p
                        break
                if target_class:
                    break

        if not target_class or not project or not target_project_id:
            raise HTTPException(status_code=404, detail="Class not found")

        class_dir = os.path.join(self._get_project_dir(target_project_id), target_class["name"])
        os.makedirs(class_dir, exist_ok=True)

        if "," in base64_data:
            header, encoded = base64_data.split(",", 1)
        else:
            encoded = base64_data

        encoded = encoded.strip()
        missing_padding = len(encoded) % 4
        if missing_padding:
            encoded += "=" * (4 - missing_padding)

        try:
            image_bytes = base64.b64decode(encoded)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

        img_id = f"img-{uuid.uuid4().hex[:8]}"
        safe_filename = f"{img_id}.jpg"
        file_path = os.path.join(class_dir, safe_filename)

        with open(file_path, "wb") as f:
            f.write(image_bytes)

        item = {
            "id": img_id,
            "filename": safe_filename,
            "url": f"/uploads/{target_project_id}/{target_class['name']}/{safe_filename}",
            "class_id": class_id,
            "created_at": datetime.now().isoformat()
        }
        target_class["images"].append(item)
        target_class["imageCount"] = len(target_class["images"])

        self._save_metadata(target_project_id, project)
        return item

    def delete_image(self, image_id: str) -> dict:
        target_project_id = None
        target_class = None
        target_image = None
        project = None

        for proj_id in os.listdir(self.uploads_dir):
            if os.path.isdir(os.path.join(self.uploads_dir, proj_id)):
                p = self.get_project(proj_id)
                for cls in p["classes"]:
                    for img in cls.get("images", []):
                        if img["id"] == image_id:
                            target_project_id = proj_id
                            target_class = cls
                            target_image = img
                            project = p
                            break
                    if target_image:
                        break
                if target_image:
                    break

        if not target_image or not target_class or not project or not target_project_id:
            raise HTTPException(status_code=404, detail="Image not found")

        file_path = os.path.join(self._get_project_dir(target_project_id), target_class["name"], target_image["filename"])
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        target_class["images"] = [i for i in target_class["images"] if i["id"] != image_id]
        target_class["imageCount"] = len(target_class["images"])
        self._save_metadata(target_project_id, project)

        return {"success": True, "image_id": image_id}

    def clear_class_images(self, class_id: str) -> dict:
        target_project_id = None
        target_class = None
        project = None

        for proj_id in os.listdir(self.uploads_dir):
            if os.path.isdir(os.path.join(self.uploads_dir, proj_id)):
                p = self.get_project(proj_id)
                for cls in p["classes"]:
                    if cls["id"] == class_id:
                        target_project_id = proj_id
                        target_class = cls
                        project = p
                        break
                if target_class:
                    break

        if not target_class or not project or not target_project_id:
            raise HTTPException(status_code=404, detail="Class not found")

        class_dir = os.path.join(self._get_project_dir(target_project_id), target_class["name"])
        deleted_count = len(target_class.get("images", []))

        if os.path.exists(class_dir):
            for f in os.listdir(class_dir):
                ext = os.path.splitext(f)[1].lower()
                if ext in ALLOWED_EXTENSIONS:
                    try:
                        os.remove(os.path.join(class_dir, f))
                    except Exception:
                        pass

        target_class["images"] = []
        target_class["imageCount"] = 0
        self._save_metadata(target_project_id, project)

        return {"success": True, "class_id": class_id, "deleted_count": deleted_count}

