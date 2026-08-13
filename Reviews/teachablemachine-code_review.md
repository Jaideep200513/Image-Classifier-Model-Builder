# Code Review — ModelForge (Teachable Machine Clone)
**Reviewer:** Senior Engineer  
**Project:** ModelForge — Image Classification Platform  
**Stack:** FastAPI + TensorFlow (Backend) · Next.js 16 + TypeScript (Frontend)

---

## Overall Verdict: ✅ Strong Intern Work — Above Average

This is a genuinely impressive piece of work for an intern. The project is **functionally complete**, well-structured, and demonstrates solid understanding of full-stack ML application development. It's not just a toy — it has real export formats, transfer learning, and production-grade Docker support. That said, there are meaningful issues to address before this could be considered production-ready.

---

## ✅ What Was Done Well

### 1. Architecture & Project Structure
- Clean separation of concerns: `api/`, `schemas/`, `services/`, `models/` in backend
- Each service is focused (`DatasetService`, `TrainingService`, `InferenceService`, `ExportService`)
- Frontend is organized by feature (`dataset-panel/`, `training-panel/`, `preview-panel/`, etc.)
- Docker + Nginx configuration included — shows production deployment thinking

### 2. Backend: Services are well-implemented
- `TrainingService` uses **MobileNetV2 Transfer Learning** with data augmentation — appropriate ML choice for small datasets
- The custom `ProgressCallback` for live epoch tracking is smart and works cleanly
- Model cache in `InferenceService` with mtime-based invalidation is a solid optimization pattern
- Export formats (Keras, SavedModel, TF.js, .tm) cover real-world use cases
- Input validation is present and meaningful throughout

### 3. Frontend: Good UX patterns
- `useBeforeUnload` / `sendBeacon` pattern to prevent accidental data loss is thoughtful
- TanStack Query for server-state management is the right tool
- 3-panel layout (Dataset → Training → Preview) mirrors Teachable Machine's UX effectively
- Inline project renaming with Enter/Escape key support is polished

### 4. Tests Exist
- 5 test files covering API, export, import, inference, and training pipeline
- Shows testing awareness, which many interns skip entirely

---

## ⚠️ Issues & Feedback (Priority Order)

---

### 🔴 Critical — Must Fix

#### 1. README has an unresolved Git merge conflict
**File:** [`README.md`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/README.md) (Lines 1, 186, 279)

```diff
- <<<<<<< HEAD
- # ModelForge — Image Classification Platform
- ...
- =======
- # Teachable Machine
- ...
- >>>>>>> 7bbbdc23...
```

The README was merged but the conflict markers were left in. The file contains **both the intern's good README and the GitLab default template** — this is unprofessional and means the project cannot be shared as-is. Always resolve merge conflicts before committing.

**Fix:** Remove the GitLab template section and the conflict markers. Keep only the ModelForge README.

---

#### 2. Single-project architecture is a hard-coded limitation
**File:** [`workspace/page.tsx`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/frontend/app/workspace/page.tsx#L20)

```typescript
const DEFAULT_PROJECT_ID = "default-project";
```

The entire workspace is locked to one hardcoded project ID. If two users use the app simultaneously, they overwrite each other's data. The backend already supports multiple project IDs, but the frontend never creates or selects them.

**Fix:** The `/new-project` page should call `POST /projects` and store the returned project ID in a URL param (e.g., `/workspace?projectId=proj-abc123`).

---

#### 3. `pagehide` beacon auto-deletes ALL user data silently
**File:** [`workspace/page.tsx`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/frontend/app/workspace/page.tsx#L96-L103)

```typescript
const handlePageHide = () => {
  const resetUrl = `.../${DEFAULT_PROJECT_ID}/reset`;
  navigator.sendBeacon(resetUrl);  // Fires silently on every page hide!
};
```

**Every time the browser tab loses focus, minimizes, or the user navigates away, the entire project dataset and trained model is wiped without confirmation.** `pagehide` fires on tab switch, not just close. This is a critical data-loss bug.

**Fix:** Either remove this `pagehide` handler entirely, or only fire it on confirmed navigation away (i.e., after `handleConfirmLeaveAndErase`).

---

### 🟠 Important — Should Fix

#### 4. Bare `except Exception: pass` silently swallows errors
**File:** [`dataset_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/dataset_service.py#L45-L46)

This pattern appears **10+ times** across the services:
```python
except Exception:
    pass  # ← silent failure
```

When metadata fails to load, or an image is corrupt, or a file operation fails — the error is discarded silently. This makes debugging extremely difficult in production.

**Fix:** At minimum, log the exception:
```python
except Exception as e:
    logger.warning(f"Failed to load metadata for {project_id}: {e}")
```

---

#### 5. `_find_class_and_project` scans ALL projects on every request
**File:** [`dataset_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/dataset_service.py#L212-L220)

```python
def _find_class_and_project(self, class_id: str):
    for proj_id in os.listdir(self.uploads_dir):  # scans everything!
        p = self.get_project(proj_id)             # loads each project from disk
        for cls in p.get("classes", []):
            if cls["id"] == class_id:
                return proj_id, cls, p
```

This O(N×M) filesystem scan is called on **every image upload, class rename, and image delete**. With many projects and images, this will be very slow.

**Fix:** The API routes should always pass `project_id` alongside `class_id` so the service can look up directly without scanning everything.

---

#### 6. All image data is loaded into memory at once during training
**File:** [`training_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/training_service.py#L227-L246)

```python
X_data = []
for img_path, label in zip(image_paths, labels):
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    X_data.append(arr)  # Everything in RAM at once

X = np.array(X_data, dtype=np.float32)  # Duplicate memory allocation
```

For 500+ images at 224×224×3 float32, this is ~300MB+ of RAM. This will crash on large datasets.

**Fix:** Use `tf.keras.utils.image_dataset_from_directory()` or a custom generator to load images in batches.

---

#### 7. Tailwind CSS class strings stored in Python backend
**File:** [`dataset_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/dataset_service.py#L12-L21)

```python
CLASS_COLORS = [
    "bg-blue-100 text-blue-700",   # ← Tailwind CSS classes in Python!
    "bg-emerald-100 text-emerald-700",
    ...
]
```

And the same constant is **duplicated** in `inference_service.py` lines 11-20.

**Issues:**
- Backend should not know about frontend CSS framework specifics
- The same constant is copy-pasted in two places (DRY violation)
- If Tailwind classes change or the frontend switches frameworks, the backend breaks

**Fix:** Store color values as simple hex/HSL codes in the backend (e.g., `#3b82f6`). Map to Tailwind classes in the frontend.

---

#### 8. Training runs on a daemon thread with no timeout or memory cleanup
**File:** [`training_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/training_service.py#L199-L204)

```python
thread = threading.Thread(
    target=self._run_tensorflow_training,
    daemon=True
)
thread.start()
```

- There is no maximum timeout on training — a stuck job runs forever
- The in-memory model (`X`, `X_train`, `X_val`) is never explicitly freed after training ends
- TensorFlow session memory is not cleared between training runs, which can cause GPU/CPU memory leaks

**Fix:** Add a timeout mechanism. After training finishes, call `del X, X_train, X_val, model` and `import gc; gc.collect()`.

---

### 🟡 Minor — Nice to Fix

#### 9. `type` is a Python built-in — used as a parameter name
**File:** [`dataset_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/dataset_service.py#L116)

```python
def create_project(self, name: str = "Image Project", type: str = "image", ...):
```

Using `type` as a parameter name **shadows Python's built-in `type()` function** within this scope. Rename it to `project_type`.

---

#### 10. `app/models/` directory is empty
**File:** [`backend/app/models/__init__.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/models/__init__.py)

The `models/` directory only has an empty `__init__.py`. This suggests the intern planned to put database models here but either forgot or didn't need them. Either populate it or remove it to avoid confusion.

---

#### 11. `get_project` always writes metadata back to disk
**File:** [`dataset_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/dataset_service.py#L82-L114)

```python
def get_project(self, project_id: str) -> dict:
    ...
    self._save_metadata(project_id, project)  # Write on every GET!
    return project
```

A read operation (`get_project`) should not write to disk. This causes unnecessary I/O and can cause race conditions if two requests hit simultaneously. The sync-from-filesystem logic should only write back when new files are discovered.

---

#### 12. Dependency injection via circular import pattern
**File:** [`api/projects.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/api/projects.py#L8-L10)

```python
def get_dataset_service() -> DatasetService:
    from app.main import dataset_service  # Late import to avoid circular dependency
    return dataset_service
```

This pattern (late `from app.main import ...`) is repeated in every router file. It works but is fragile. The proper FastAPI pattern is to use `app.state` or a dependency injection module.

---

#### 13. TF.js export is incomplete — the HTML template is a stub
**File:** [`export_service.py`](file:///d:/LathaT/Projects/0-SampleProjects-R&D/TeachbleMachine/teachable-machine/backend/app/services/export_service.py#L368-L373)

```javascript
// Note: When serving model.json via web server:
// const model = await tf.loadLayersModel('model.json');
// const tensor = tf.browser.fromPixels(img)...
document.getElementById('result').innerText = 'Image loaded! Check browser console...';
```

The exported `index.html` is a non-functional stub with commented-out prediction code. A user who downloads this TF.js export would see "Image loaded! Check browser console" with no actual inference happening. Either complete the implementation or don't include the HTML file.

---

## 📊 Summary Scorecard

| Category | Score | Notes |
|---|---|---|
| **Architecture** | 8/10 | Clean layering, good separation. Minor DI concern. |
| **Code Quality** | 6/10 | Silent error swallowing, DRY violations, shadowed built-ins |
| **Security** | 7/10 | File extension validation present. No auth (acceptable for internal tool). |
| **Performance** | 5/10 | Full-dataset in-memory training, O(N) filesystem scans |
| **Testing** | 6/10 | Tests exist but coverage is unknown. Need to verify they pass. |
| **Documentation** | 4/10 | README has an unresolved merge conflict — serious oversight |
| **UX/Frontend** | 8/10 | Polished UI, good UX patterns, responsive layout |
| **Overall** | **6.5/10** | Strong foundation, needs production hardening |

---

## 🎯 Top 3 Priorities Before Next Review

1. **Fix the README merge conflict** — this is the first thing any stakeholder sees
2. **Fix the `pagehide` data-loss bug** — actively destroys user work
3. **Replace the hardcoded `DEFAULT_PROJECT_ID`** — the backend already supports multi-project; the frontend just needs to use it

---

> **Final Note for the intern:** This is genuinely solid work. The ML pipeline, export formats, and UX polish show real effort and understanding. The issues listed are the kind of things that experienced engineers catch in code review — the fact that the foundation is this clean means fixing them should be straightforward. Keep it up!
