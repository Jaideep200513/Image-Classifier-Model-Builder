# ModelForge — Image Classification Model Preparation Platform

An internal platform inspired by Google's Teachable Machine for building and exporting
custom image classification models — without any ML expertise or coding.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component Library | shadcn/ui |
| State Management | TanStack Query (`@tanstack/react-query`) |
| Animations | Framer Motion |
| Backend | FastAPI (Python) |
| Storage | Filesystem (`uploads/{project_id}/{class_name}/`) |

---

## 🚀 How to Run the Project

You need **two terminal windows** (one for the backend, one for the frontend).

### Step 1: Run the Backend (FastAPI)

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Start the FastAPI server using `uvicorn`:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend API will run at **`http://localhost:8000`**. You can view interactive API docs at `http://localhost:8000/docs`.

---

### Step 2: Run the Frontend (Next.js)

1. Open a second terminal window and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   - **Workspace**: [http://localhost:3000/workspace](http://localhost:3000/workspace)
   - **Landing Page**: [http://localhost:3000](http://localhost:3000)

---

## Features (Phase 2)

- **Class Management**: Create, rename, disable, and delete dataset classes in real-time.
- **Image Upload**: Drag & Drop + multi-file selection (supports JPEG, PNG, WEBP).
- **Webcam Capture**: Live camera preview with **Hold to Record** (auto-capturing ~4 frames/sec).
- **Image Preview & Management**: Interactive thumbnail strip, fullscreen image dialog, image deletion, and sample replacement.
- **Dataset Persistence**: Filesystem storage organized under `backend/uploads/{project_id}/{class_name}/`.
- **Validation**: Automatic validation requiring ≥2 enabled classes and ≥1 sample per class.

---

## Phase Roadmap

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Frontend UI, routing, component design | ✅ Complete |
| Phase 2 | FastAPI backend, image upload, webcam, dataset management | ✅ Complete |
| Phase 3 | TensorFlow training integration, real predictions | 🔜 Planned |
| Phase 4 | Model export (TFLite, TF.js, Coral), auth | 🔜 Planned |
