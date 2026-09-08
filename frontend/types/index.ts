// ─────────────────────────────────────────────────────────
// Core domain types for the Image Classification Platform
// ─────────────────────────────────────────────────────────

export interface ImageItem {
  id: string;
  filename: string;
  url: string;
  class_id?: string;
  created_at?: string;
}

export interface ImageClass {
  id: string;
  name: string;
  color: string;
  disabled?: boolean;
  imageCount: number;
  images?: ImageItem[];
}

export interface ClassPrediction {
  class_id: string;
  class_name: string;
  confidence: number; // 0–100
  is_highest: boolean;
  color: string;
}

export interface PredictionResponse {
  predicted_class_id: string;
  predicted_class_name: string;
  confidence: number;
  prediction_time_ms: number;
  formatted_prediction_time: string;
  predictions: ClassPrediction[];
}

export interface ModelStatusResponse {
  has_model: boolean;
  trained_at?: string | null;
  classes: string[];
  error?: string | null;
}

export interface PredictionResult {
  classId: string;
  className: string;
  confidence: number; // 0–100
  color: string;
  isHighest?: boolean;
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

export interface TrainingMetrics {
  train_accuracy: number;
  val_accuracy: number;
  train_loss: number;
  val_loss: number;
  duration_seconds: number;
  formatted_duration: string;
}

export interface TrainingState {
  status: "idle" | "training" | "completed" | "error";
  progress: number; // 0–100
  currentEpoch: number;
  totalEpochs: number;
  elapsedTime: number; // seconds
  formattedElapsedTime: string;
  config: TrainingConfig;
  metrics?: TrainingMetrics | null;
  error?: string | null;
  hasTrainedModel?: boolean;
  trainedAt?: string | null;
}

export interface TrainingStatusResponse {
  status: "idle" | "training" | "completed" | "error";
  progress: number;
  current_epoch: number;
  total_epochs: number;
  elapsed_time: number;
  formatted_elapsed_time: string;
  metrics?: TrainingMetrics | null;
  error?: string | null;
  has_trained_model?: boolean;
  trained_at?: string | null;
}

export type InputSource = "webcam" | "upload";

export interface NavLink {
  label: string;
  href: string;
}

export interface ExportInfo {
  has_model: boolean;
  trained_at?: string | null;
  model_size_bytes: number;
  formatted_model_size: string;
  classes_count: number;
  formats: string[];
  error?: string | null;
}

export interface ProjectStats {
  id: string;
  name: string;
  description: string;
  classes_count: number;
  images_count: number;
  trained_at?: string | null;
  has_model: boolean;
}

export interface EpochMetric {
  epoch: number;
  accuracy?: number;
  val_accuracy?: number;
  loss?: number;
  val_loss?: number;
}

export interface ClassAccuracyStat {
  class_name: string;
  accuracy: number;
  sample_count: number;
}

export interface ConfusionMatrixData {
  classes: string[];
  matrix: number[][];
}

export interface UnderTheHoodAnalytics {
  epochs: number;
  accuracy_per_epoch: EpochMetric[];
  loss_per_epoch: EpochMetric[];
  accuracy_per_class: ClassAccuracyStat[];
  confusion_matrix: ConfusionMatrixData;
}

export interface HistoryClassSummary {
  id: string;
  name: string;
  color: string;
  disabled: boolean;
  image_count: number;
}

export interface ProjectHistoryItem {
  id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
  classes_count: number;
  total_images_count: number;
  has_trained_model: boolean;
  trained_at?: string | null;
  metrics?: TrainingMetrics | null;
  under_the_hood?: UnderTheHoodAnalytics | null;
  classes: HistoryClassSummary[];
}

