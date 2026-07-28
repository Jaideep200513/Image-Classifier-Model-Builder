import { Project, ImageClass, ImageItem } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getFullImageUrl(relativeOrAbsoluteUrl: string): string {
  if (!relativeOrAbsoluteUrl) return "";
  if (relativeOrAbsoluteUrl.startsWith("http://") || relativeOrAbsoluteUrl.startsWith("https://") || relativeOrAbsoluteUrl.startsWith("data:")) {
    return relativeOrAbsoluteUrl;
  }
  return `${API_BASE}${relativeOrAbsoluteUrl.startsWith("/") ? "" : "/"}${relativeOrAbsoluteUrl}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error("Backend unavailable. Please ensure FastAPI server is running on http://localhost:8000.");
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


  // Classes
  addClass: (projectId: string, name: string) =>
    request<ImageClass>(`/projects/${projectId}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  updateClass: (classId: string, payload: { name?: string; disabled?: boolean }) =>
    request<ImageClass>(`/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteClass: (classId: string) =>
    request<{ success: boolean; class_id: string }>(`/classes/${classId}`, {
      method: "DELETE",
    }),

  // Images
  uploadImages: (classId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<ImageItem[]>(`/classes/${classId}/upload`, {
      method: "POST",
      body: formData,
    });
  },

  captureImage: (classId: string, base64Image: string) =>
    request<ImageItem>(`/classes/${classId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_data: base64Image }),
    }),

  deleteImage: (imageId: string) =>
    request<{ success: boolean; image_id: string }>(`/images/${imageId}`, {
      method: "DELETE",
    }),

  clearClassImages: (classId: string) =>
    request<{ success: boolean; class_id: string; deleted_count: number }>(`/classes/${classId}/images`, {
      method: "DELETE",
    }),

  // Training
  startTraining: (projectId: string, config: { epochs: number; batchSize: number; learningRate: number }) =>
    request<any>(`/projects/${projectId}/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }),

  getTrainingStatus: (projectId: string) =>
    request<any>(`/projects/${projectId}/train/status`),

  cancelTraining: (projectId: string) =>
    request<any>(`/projects/${projectId}/train/cancel`, {
      method: "POST",
    }),

  // Inference / Testing
  getModelStatus: (projectId: string) =>
    request<import("@/types").ModelStatusResponse>(`/projects/${projectId}/model-status`),

  predictImage: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<import("@/types").PredictionResponse>(`/projects/${projectId}/predict/image`, {
      method: "POST",
      body: formData,
    });
  },

  predictWebcam: (projectId: string, base64Image: string) =>
    request<import("@/types").PredictionResponse>(`/projects/${projectId}/predict/webcam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_data: base64Image }),
    }),

  // Project Management & Export
  getProjectInfo: (projectId: string) =>
    request<import("@/types").ProjectStats>(`/projects/${projectId}/info`),

  updateProject: (projectId: string, data: { name: string; description?: string }) =>
    request<import("@/types").Project>(`/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  duplicateProject: (projectId: string) =>
    request<import("@/types").Project>(`/projects/${projectId}/duplicate`, {
      method: "POST",
    }),

  deleteProject: (projectId: string) =>
    request<{ success: boolean; message: string }>(`/projects/${projectId}`, {
      method: "DELETE",
    }),

  getExportInfo: (projectId: string) =>
    request<import("@/types").ExportInfo>(`/projects/${projectId}/export/info`),

  getExportKerasUrl: (projectId: string) =>
    `${API_BASE}/projects/${projectId}/export/keras`,

  getExportSavedModelUrl: (projectId: string) =>
    `${API_BASE}/projects/${projectId}/export/savedmodel`,
};

