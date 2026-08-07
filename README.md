# ModelForge — Image Classification Platform

ModelForge is a fast, internal, production-ready platform inspired by Teachable Machine for visually building, training, previewing, and exporting custom image classification models — without writing code or requiring machine learning expertise.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 15+ (App Router) | React Server Components, TypeScript, Client-side state |
| **Language** | TypeScript / Python 3.10+ | Strict type safety across UI and API layers |
| **Styling & UI** | Vanilla Tailwind CSS & shadcn/ui | Clean, responsive UI with custom HSL palette & micro-animations |
| **State Management** | TanStack Query (`@tanstack/react-query`) | Asynchronous server-state management & live polling |
| **Animations** | Framer Motion | Dynamic layout transitions & animated confidence bars |
| **Backend API** | FastAPI (Python) | High-performance async REST API framework |
| **Machine Learning** | TensorFlow 2.x & Keras 3 | MobileNetV2 Transfer Learning & In-Memory Inference |
| **Storage & Persistence**| Filesystem Storage | Clean directory layout under `backend/uploads/{project_id}/` |

---

## 📁 Folder Structure

```
image-model-builder/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI API routers (projects, classes, images, training, inference, export)
│   │   ├── schemas/         # Pydantic data validation models & response contracts
│   │   ├── services/        # Core services (Dataset, Training, Inference, Export)
│   │   └── main.py          # FastAPI application entrypoint & middleware configuration
│   ├── tests/               # Pytest unit & integration test suites
│   ├── uploads/             # Project dataset & trained model artifact directory
│   ├── main.py              # Root uvicorn entrypoint wrapper
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── app/                 # Next.js App Router pages (landing, new-project, workspace)
│   ├── components/          # Reusable UI components & modals
│   │   ├── dataset-panel/   # Class management, webcam capture, image upload modals
│   │   ├── export-modal/    # Model export modal (.keras, SavedModel, TF.js, .tm)
│   │   ├── hero/            # Landing page hero section
│   │   ├── navbar/          # Floating navigation bar
│   │   ├── preview-panel/   # Real-time model inference testing (upload & webcam)
│   │   ├── project-modal/   # Project information & settings modal
│   │   ├── training-panel/  # Training control, hyper-parameters, Under the Hood analytics
│   │   └── ui/              # shadcn/ui base primitives
│   ├── hooks/               # Custom React hooks (useProjectData, useTraining, useInference)
│   ├── lib/                 # API client utilities and helper functions
│   └── types/               # TypeScript domain interfaces and type definitions
├── docker-compose.yml       # Production multi-container orchestration
├── nginx.conf               # Reverse proxy configuration
└── README.md                # Project documentation
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10 to v3.13
- **Git**

---

### 1. Environment Configuration

Copy `.env.example` or create a `.env` file in the `backend/` directory:

```bash
# backend/.env
HOST=0.0.0.0
PORT=8000
UPLOADS_DIR=uploads
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

### 2. Backend Setup (FastAPI + TensorFlow)

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows:
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   - API Server: **`http://localhost:8000`**
   - Interactive OpenAPI Documentation: **`http://localhost:8000/docs`**

---

### 3. Frontend Setup (Next.js)

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

4. Access the application in your browser:
   - **Landing Page**: [http://localhost:3000](http://localhost:3000)
   - **New Project**: [http://localhost:3000/new-project](http://localhost:3000/new-project)
   - **Workspace**: [http://localhost:3000/workspace](http://localhost:3000/workspace)

---

## 🛠️ Complete Application Workflow

```
[1. Create Project] ──> [2. Manage Classes] ──> [3. Upload / Capture] ──> [4. Train Model] ──> [5. Preview Model] ──> [6. Export Model]
```

1. **Create Project**: Start from scratch or import an existing Teachable Machine `.tm` archive.
2. **Manage Classes**: Add, rename, disable, or delete dataset classes.
3. **Upload / Capture Images**: Drag-and-drop image files (JPEG, PNG, WEBP) or capture frames via webcam with hold-to-record streaming.
4. **Train Model**: Configure hyper-parameters (Epochs, Batch Size, Learning Rate), start training with live progress, inspect metrics, and view detailed graphs in the "Under the Hood" analytics modal.
5. **Preview Model**: Test the trained classifier instantly using live webcam feed or image upload with confidence score breakdown and latency measurement.
6. **Export Model**: Download trained artifacts in standard formats:
   - **Keras Bundle (.zip)**: `model.keras`, `classes.json`, `README.txt` Python guide
   - **TensorFlow SavedModel (.zip)**: `saved_model.pb` archive for TF Serving
   - **TensorFlow.js Package (.zip)**: `model.json`, `index.html` web runner
   - **Teachable Machine (.tm)**: Portable archive file for re-importing project state

---

## 🧪 Testing & Verification

### Backend Tests
Run the pytest unit and integration test suite:
```bash
cd backend
python -m pytest
```

### Frontend Verification
Run TypeScript type checks and ESLint verification:
```bash
cd frontend
npm run lint
npx tsc --noEmit
```

---

## 📄 License
Internal use only. All rights reserved.
