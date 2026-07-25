// ─────────────────────────────────────────────────────────
// Core domain types for the Image Classification Platform
// ─────────────────────────────────────────────────────────

export interface ImageItem {
  id: string;
  filename: string;
  url: string;
  class_id: string;
  created_at: string;
}

export interface ImageClass {
  id: string;
  name: string;
  color: string;
  disabled?: boolean;
  imageCount: number;
  images?: ImageItem[];
}

export interface PredictionResult {
  classId: string;
  className: string;
  confidence: number; // 0–100
  color: string;
}

export type ProjectType = "image" | "audio" | "pose";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  classes: ImageClass[];
  created_at: string;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
}

export interface TrainingState {
  status: "idle" | "training" | "complete" | "error";
  progress: number; // 0–100
  currentEpoch: number;
  config: TrainingConfig;
}

export type InputSource = "webcam" | "upload";

export interface NavLink {
  label: string;
  href: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}
