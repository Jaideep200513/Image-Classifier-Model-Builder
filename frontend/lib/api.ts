import {
  Project,
  ImageClass,
  ImageItem,
  TrainingStatusResponse,
  UnderTheHoodAnalytics,
  ModelStatusResponse,
  PredictionResponse,
  ProjectStats,
  ExportInfo,
  ProjectHistoryItem,
} from "@/types";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export function getFullImageUrl(relativeOrAbsoluteUrl: string): string {
  if (!relativeOrAbsoluteUrl) return "";
  if (relativeOrAbsoluteUrl.startsWith("http://") || relativeOrAbsoluteUrl.startsWith("https://") || relativeOrAbsoluteUrl.startsWith("data:")) {
    return relativeOrAbsoluteUrl;
  }
  const apiBase = getApiBase();
  return `${apiBase}${relativeOrAbsoluteUrl.startsWith("/") ? "" : "/"}${relativeOrAbsoluteUrl}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const apiBase = getApiBase();
  const url = `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error(`Backend unavailable. Please ensure FastAPI server is reachable at ${apiBase}.`);
  }

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorMsg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Project
  getAllProjects: () => request<ProjectHistoryItem[]>("/projects"),
  getProject: (projectId: string) => request<Project>(`/projects/${projectId}`),

  createProject: (name = "Image Project") =>
    request<Project>("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: "image" }),
    }),
  resetProject: (projectId: string) =>
    request<Project>(`/projects/${projectId}/reset`, {
      method: "POST",
    }),

  importTmProject: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<Project>(`/projects/${projectId}/import-tm`, {
      method: "POST",
      body: formData,
    });
  },


  // Classes
  addClass: (projectId: string, name: string) =>
    request<ImageClass>(`/projects/${projectId}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  updateClass: (classId: string, payload: { name?: string; disabled?: boolean }, projectId?: string) =>
    request<ImageClass>(`/classes/${classId}${projectId ? `?project_id=${projectId}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteClass: (classId: string, projectId?: string) =>
    request<{ success: boolean; class_id: string }>(`/classes/${classId}${projectId ? `?project_id=${projectId}` : ""}`, {
      method: "DELETE",
    }),

  // Images
  uploadImages: (classId: string, files: File[], projectId?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<ImageItem[]>(`/classes/${classId}/upload${projectId ? `?project_id=${projectId}` : ""}`, {
      method: "POST",
      body: formData,
    });
  },

  captureImage: (classId: string, base64Image: string, projectId?: string) =>
    request<ImageItem>(`/classes/${classId}/capture${projectId ? `?project_id=${projectId}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_data: base64Image }),
    }),

  deleteImage: (imageId: string, projectId?: string) =>
    request<{ success: boolean; image_id: string }>(`/images/${imageId}${projectId ? `?project_id=${projectId}` : ""}`, {
      method: "DELETE",
    }),

  clearClassImages: (classId: string, projectId?: string) =>
    request<{ success: boolean; class_id: string; deleted_count: number }>(`/classes/${classId}/images${projectId ? `?project_id=${projectId}` : ""}`, {
      method: "DELETE",
    }),

  // Training
  startTraining: (projectId: string, config: { epochs: number; batchSize: number; learningRate: number }) =>
    request<TrainingStatusResponse>(`/projects/${projectId}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }),

  getTrainingStatus: (projectId: string) =>
    request<TrainingStatusResponse>(`/projects/${projectId}/train/status`),

  cancelTraining: (projectId: string) =>
    request<TrainingStatusResponse>(`/projects/${projectId}/train/cancel`, {
      method: "POST",
    }),

  getUnderTheHood: (projectId: string) =>
    request<UnderTheHoodAnalytics>(`/projects/${projectId}/train/under-the-hood`),

  // Inference / Testing
  getModelStatus: (projectId: string) =>
    request<ModelStatusResponse>(`/projects/${projectId}/model-status`),

  predictImage: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<PredictionResponse>(`/projects/${projectId}/predict/image`, {
      method: "POST",
      body: formData,
    });
  },

  predictWebcam: (projectId: string, base64Image: string) =>
    request<PredictionResponse>(`/projects/${projectId}/predict/webcam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_data: base64Image }),
    }),

  // Project Management & Export
  getProjectInfo: (projectId: string) =>
    request<ProjectStats>(`/projects/${projectId}/info`),

  updateProject: (projectId: string, data: { name: string; description?: string }) =>
    request<Project>(`/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  duplicateProject: (projectId: string) =>
    request<Project>(`/projects/${projectId}/duplicate`, {
      method: "POST",
    }),

  deleteProject: (projectId: string) =>
    request<{ success: boolean; message: string }>(`/projects/${projectId}`, {
      method: "DELETE",
    }),

  getExportInfo: (projectId: string) =>
    request<ExportInfo>(`/projects/${projectId}/export/info`),

  getExportKerasUrl: (projectId: string) =>
    `${getApiBase()}/projects/${projectId}/export/keras`,

  getExportSavedModelUrl: (projectId: string) =>
    `${getApiBase()}/projects/${projectId}/export/savedmodel`,

  getExportTfjsUrl: (projectId: string) =>
    `${getApiBase()}/projects/${projectId}/export/tfjs`,

  getExportTmUrl: (projectId: string) =>
    `${getApiBase()}/projects/${projectId}/export/tm`,
};

