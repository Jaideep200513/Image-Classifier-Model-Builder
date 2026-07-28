# ModelForge — Image Classification Model Preparation Platform

An internal, production-ready platform inspired by Google's Teachable Machine for building, training, testing, and exporting custom image classification models — without writing code or needing ML expertise.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 15+ (App Router) | React Server Components, TypeScript, Client-side state |
| **Language** | TypeScript / Python 3.10+ | Strict type safety across UI and API layers |
| **Styling & UI** | Vanilla Tailwind CSS & shadcn/ui | Glassmorphic design, HSL palette, CSS micro-animations |
| **State Management** | TanStack Query (`@tanstack/react-query`) | Asynchronous server-state management & live polling |
| **Animations** | Framer Motion | Dynamic layout transitions & animated output bars |
| **Backend API** | FastAPI (Python) | High-performance async REST API framework |
| **Machine Learning** | TensorFlow 2.x & Keras 3 | MobileNetV2 Transfer Learning & In-Memory Inference |
| **Storage & Persistence**| Filesystem Storage | Clean directory layout under `backend/uploads/{project_id}/` |

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10, v3.11, v3.12, or v3.13
- **Git**

---

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory (or copy from `.env.example`):

```bash
# backend/.env
HOST=0.0.0.0
PORT=8000
UPLOADS_DIR=uploads
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

### 2. Backend Execution (FastAPI + TensorFlow)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On Windows:
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python dependencies:
   ```bash
   pip install tensorflow fastapi uvicorn pillow pydantic python-multipart httpx pytest
   ```

4. Launch the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - API Server: **`http://localhost:8000`**
   - OpenAPI Docs: **`http://localhost:8000/docs`**

---

### 3. Frontend Execution (Next.js)

1. Open a second terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - **Workspace**: [http://localhost:3000/workspace](http://localhost:3000/workspace)
   - **Landing Page**: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Complete Application Workflows

```
  [1. Dataset Management]  --->  [2. Model Training]  --->  [3. Live Inference]  --->  [4. Model Export]
   • Create/rename classes       • MobileNetV2 backbone      • Webcam / Upload testing    • Keras (.keras) bundle
   • Upload images / Webcam      • Pretrained ImageNet weights• Real-time latency (ms)   • SavedModel archive (.zip)
   • Hold-to-record capture      • Live epoch monitoring     • Dynamic confidence bars   • classes.json & Python guide
```

### 1. Dataset Management Workflow (Phase 2)
- Create custom image classification classes.
- Upload image files (JPEG, PNG, WEBP) or capture frames using live webcam **Hold to Record** (~4 frames/sec).
- Real-time pre-training validation enforcing ≥2 enabled classes and ≥10 images per enabled class.

### 2. Training Pipeline Workflow (Phase 3)
- Configure hyper-parameters (Epochs, Batch Size, Learning Rate).
- Asynchronous background thread training using MobileNetV2 transfer learning (ImageNet pretrained weights, frozen backbone, GlobalAveragePooling2D, Dropout, Softmax head).
- Live progress polling, elapsed time clock, training & validation accuracy/loss metrics, and cancellation support.

### 3. Model Inference & Testing Workflow (Phase 4)
- Fast in-memory model caching via `InferenceService`, eliminating reload latency.
- Real-time prediction using uploaded image files or single-frame webcam captures (**"Capture & Predict"**).
- Displays top class highlight badge, confidence percentage, prediction latency in milliseconds, and animated confidence bar charts.
- Auto-synchronizes class names when edited on the left.

### 4. Model Export Workflow (Phase 5)
- Click **"Export Model"** in the topbar to open the Export Modal.
- Inspect model file size, classes count, and training date.
- Download **Keras Bundle (.zip)** containing `model.keras`, `classes.json`, `training_metadata.json`, and Python code snippet `README.txt`.
- Download **TensorFlow SavedModel (.zip)** archive for TF Serving and C++ deployment.

---

## 🧪 Testing

Run backend unit and integration test suite:

```bash
cd backend
python -m pytest
```

Run frontend TypeScript type safety check:

```bash
cd frontend
npx tsc --noEmit
```

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `Backend unavailable` toast error | FastAPI server is not running on port 8000 | Ensure `python -m uvicorn app.main:app --reload --port 8000` is running in `backend/` |
| `Camera access error` | Browser permission or HTTPS restriction | Allow camera permissions in browser settings |
| `Validation Error: Need >= 10 images` | Enabled class has fewer than 10 images | Add more sample images or disable the class before training |
| `No trained model available` | Project has not been trained yet | Click **Train Model** in the Training panel to generate `model.keras` |

---

## 📋 Phase Roadmap Summary

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Frontend UI, routing, component design | ✅ Complete |
| Phase 2 | FastAPI backend, image upload, webcam, dataset management | ✅ Complete |
| Phase 3 | TensorFlow training pipeline, MobileNetV2 transfer learning, progress monitoring | ✅ Complete |
| Phase 4 | Model inference, memory caching, live testing (upload & webcam) | ✅ Complete |
| Phase 5 | Production polish, Model Export (.keras & SavedModel ZIPs), Project Management | ✅ Complete |
