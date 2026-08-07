<<<<<<< HEAD
# ModelForge — Image Classification Platform

## 🌐 Live Demo

**Oracle Cloud Deployment:**  
http://140.245.221.99:3000/

> **Note:** The application is hosted on an Oracle Cloud VM. If the instance is stopped or restarted, the URL may become temporarily unavailable.

---

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
=======
# Teachable Machine



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.pigeon-tech.com/root/teachable-machine.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://gitlab.pigeon-tech.com/root/teachable-machine/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Automatically merge when pipeline succeeds](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing(SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thank you to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README
Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 7bbbdc23fcdc699147bfef41f3a9dc098c2c787a
