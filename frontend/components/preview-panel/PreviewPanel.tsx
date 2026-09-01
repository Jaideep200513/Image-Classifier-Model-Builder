"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, Eye, ChevronDown, CheckCircle2, AlertCircle, Loader2, Sparkles, Crop, RotateCcw, Edit2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { InputSource, ClassPrediction, ImageClass } from "@/types";
import { useInference } from "@/hooks/useInference";
import InteractiveRoiModal from "./InteractiveRoiModal";

const INPUT_SOURCES: { value: InputSource; label: string }[] = [
  { value: "webcam", label: "Webcam" },
  { value: "upload", label: "Upload" },
];

interface PreviewPanelProps {
  classes?: ImageClass[];
  projectId?: string;
}

export default function PreviewPanel({ classes = [], projectId = "default-project" }: PreviewPanelProps) {
  const [inputSource, setInputSource] = useState<InputSource>("webcam");
  const [inputOn, setInputOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Image & ROI state management
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [isRoiCropped, setIsRoiCropped] = useState(false);
  const [showRoiModal, setShowRoiModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    hasModel,
    predictionResult,
    isPredicting,
    predictImage,
    predictWebcam,
    clearPrediction,
  } = useInference(projectId);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error.name === "NotReadableError" || error.name === "OverconstrainedError") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw err;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const error = err as { name?: string };
      setCameraActive(false);
      if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setCameraError("Camera is in use by another tab or modal.");
      } else {
        setCameraError("Camera permission denied or unavailable.");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    const handleModalOpen = () => stopCamera();
    const handleModalClose = () => {
      if (inputOn && inputSource === "webcam" && hasModel && !isRoiCropped) {
        startCamera();
      }
    };

    window.addEventListener("webcam-modal-open", handleModalOpen);
    window.addEventListener("webcam-modal-close", handleModalClose);

    return () => {
      window.removeEventListener("webcam-modal-open", handleModalOpen);
      window.removeEventListener("webcam-modal-close", handleModalClose);
    };
  }, [inputOn, inputSource, hasModel, isRoiCropped, startCamera, stopCamera]);

  useEffect(() => {
    if (inputOn && inputSource === "webcam" && hasModel && !isRoiCropped) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputOn, inputSource, hasModel, isRoiCropped, startCamera, stopCamera]);

  // Capture current webcam frame into data URL
  const captureWebcamFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.95);
  };

  // Execute inference on current active target (full image or cropped ROI)
  async function handlePredict() {
    if (!hasModel || isPredicting) return;

    if (croppedFile) {
      await predictImage(croppedFile);
    } else if (isRoiCropped && activeImageSrc) {
      await predictWebcam(activeImageSrc);
    } else if (inputSource === "webcam") {
      const frameBase64 = activeImageSrc || captureWebcamFrame();
      if (frameBase64) {
        setOriginalImageSrc(frameBase64);
        setActiveImageSrc(frameBase64);
        await predictWebcam(frameBase64);
      }
    } else if (uploadedFile) {
      await predictImage(uploadedFile);
    }
  }

  // Handle open ROI crop modal
  const handleOpenRoiModal = () => {
    if (inputSource === "webcam" && !originalImageSrc) {
      const frame = captureWebcamFrame();
      if (!frame) return;
      setOriginalImageSrc(frame);
      if (!isRoiCropped) setActiveImageSrc(frame);
    }
    setShowRoiModal(true);
  };

  // Handle ROI crop apply callback
  const handleApplyRoiCrop = (croppedDataUrl: string, file: File) => {
    setActiveImageSrc(croppedDataUrl);
    setCroppedFile(file);
    setIsRoiCropped(true);
    clearPrediction();
  };

  // Reset to full uncropped image
  const handleResetToFullImage = () => {
    setActiveImageSrc(originalImageSrc);
    setCroppedFile(null);
    setIsRoiCropped(false);
    clearPrediction();
    if (inputSource === "webcam" && inputOn && hasModel) {
      startCamera();
    }
  };

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploadedFile(file);
    setCroppedFile(null);
    setIsRoiCropped(false);

    const objectUrl = URL.createObjectURL(file);
    setOriginalImageSrc(objectUrl);
    setActiveImageSrc(objectUrl);
    clearPrediction();

    if (hasModel) {
      predictImage(file);
    }
  }

  const enabledClasses = classes.filter((c) => !c.disabled);

  const mappedPredictions: ClassPrediction[] = predictionResult
    ? predictionResult.predictions.map((p, idx) => {
      const matched =
        classes.find((c) => c.id === p.class_id || c.name.toLowerCase() === p.class_name.toLowerCase()) ||
        enabledClasses[idx];
      return {
        ...p,
        class_name: matched ? matched.name : p.class_name,
        color: matched ? matched.color : p.color,
      };
    })
    : enabledClasses.map((c, idx) => ({
      class_id: c.id,
      class_name: c.name,
      confidence: 0,
      is_highest: idx === 0,
      color: c.color,
    }));

  const topPredictedName = predictionResult
    ? (mappedPredictions.find((p) => p.is_highest) || mappedPredictions[0])?.class_name || predictionResult.predicted_class_name
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col"
      style={{ borderColor: "#e2e5f0" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#dde2f5" }}>
            <Eye className="h-4 w-4" style={{ color: "#3d0099" }} />
          </div>
          <span className="text-base font-bold" style={{ color: "#1a1a2e" }}>Preview &amp; Test</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">

        {/* Model Availability Alert */}
        <div
          className={`rounded-xl border p-3 text-xs leading-relaxed transition-colors ${hasModel
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
        >
          <div className="flex items-center gap-2">
            {hasModel ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-bold text-xs">
                {hasModel ? "Trained Model Ready" : "No Model Available"}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {hasModel
                  ? "Test predictions live with webcam or upload."
                  : "No trained model available. Please train a model first."}
              </p>
            </div>
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted-foreground flex-shrink-0">Input</span>

          {/* On/Off toggle */}
          <button
            onClick={() => {
              setInputOn((v) => !v);
              clearPrediction();
            }}
            disabled={!hasModel}
            className={cn(
              "relative flex h-5 w-9 flex-shrink-0 items-center rounded-full border-2 transition-colors duration-200",
              !hasModel ? "opacity-40 cursor-not-allowed border-border bg-muted" : inputOn ? "border-primary bg-primary cursor-pointer" : "border-border bg-muted cursor-pointer"
            )}
            aria-label="Toggle input"
            id="input-toggle-btn"
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "absolute h-3 w-3 rounded-full bg-white shadow",
                inputOn ? "left-[18px]" : "left-[2px]"
              )}
            />
          </button>
          <span className="text-xs font-semibold text-foreground">{inputOn && hasModel ? "ON" : "OFF"}</span>

          {/* Source selector */}
          <div className="flex-1" />
          <div className="relative">
            <select
              value={inputSource}
              onChange={(e) => {
                setInputSource(e.target.value as InputSource);
                setOriginalImageSrc(null);
                setActiveImageSrc(null);
                setUploadedFile(null);
                setCroppedFile(null);
                setIsRoiCropped(false);
                clearPrediction();
              }}
              disabled={!hasModel}
              className="appearance-none rounded-lg border border-border bg-muted/40 py-1 pl-3 pr-7 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              id="input-source-select"
            >
              {INPUT_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Hidden canvas for webcam capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Display Area */}
        <motion.div
          key={inputSource + (isRoiCropped ? "-cropped" : "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative flex h-52 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition-colors group",
            inputOn && hasModel
              ? "border-[#3d0099]/30 bg-[#1a1a2e]"
              : "border-dashed border-[#dde2f5] bg-[#f4f0ff]"
          )}
        >
          {!hasModel ? (
            <div className="text-center text-muted-foreground p-4">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-700" />
              </div>
              <p className="text-xs font-semibold text-foreground">Inference Disabled</p>
              <p className="text-[11px] text-muted-foreground mt-1">Train a model in the Training panel to enable live testing.</p>
            </div>
          ) : !inputOn ? (
            <div className="text-center text-muted-foreground p-4">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-700" />
              </div>
              <p className="text-xs font-semibold text-foreground">Input is OFF</p>
              <p className="text-[11px] text-muted-foreground mt-1">Toggle input ON to start testing predictions.</p>
            </div>
          ) : isRoiCropped && activeImageSrc ? (
            /* Active ROI Cropped Target Display */
            <div className="relative w-full h-full flex items-center justify-center bg-black/90 p-2">
              <img src={activeImageSrc} alt="Cropped ROI" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[10px] font-bold shadow">
                <Crop className="h-3 w-3" />
                ROI Active (Cropped)
              </div>
            </div>
          ) : inputSource === "webcam" ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {activeImageSrc && !cameraActive ? (
                <img src={activeImageSrc} alt="Captured frame" className="w-full h-full object-contain" />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              {!cameraActive && !activeImageSrc && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white text-xs p-4 text-center space-y-2">
                  <AlertCircle className="h-6 w-6 text-amber-400 mx-auto" />
                  <p className="font-semibold text-slate-200">
                    {cameraError || "Starting camera..."}
                  </p>
                  {cameraError && (
                    <button
                      onClick={() => startCamera()}
                      className="px-3 py-1 text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-purple-50/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
              {activeImageSrc ? (
                <img src={activeImageSrc} alt="Upload preview" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Upload className="h-5 w-5 text-purple-700" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Click or Drag &amp; Drop Image</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Supports JPEG, PNG, WEBP</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Action Button Controls (ROI & Predict) */}
        {hasModel && inputOn && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* ROI Crop / Edit Button */}
              <button
                onClick={handleOpenRoiModal}
                disabled={isPredicting || (inputSource === "upload" && !originalImageSrc)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 font-semibold rounded-xl border transition-all cursor-pointer",
                  isRoiCropped
                    ? "border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  isPredicting || (inputSource === "upload" && !originalImageSrc) ? "opacity-50 cursor-not-allowed" : ""
                )}
                id="crop-roi-btn"
              >
                {isRoiCropped ? (
                  <>
                    <Edit2 className="h-3.5 w-3.5 text-purple-600" />
                    Edit ROI
                  </>
                ) : (
                  <>
                    <Crop className="h-3.5 w-3.5 text-purple-600" />
                    Crop ROI
                  </>
                )}
              </button>

              {/* Reset to Full Image Button (when ROI active) */}
              {isRoiCropped && (
                <button
                  onClick={handleResetToFullImage}
                  disabled={isPredicting}
                  className="flex items-center justify-center gap-1 text-xs py-2 px-3 font-medium rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  id="reset-roi-btn"
                  title="Reset to original uncropped image"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Predict Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={handlePredict}
                disabled={isPredicting || (inputSource === "upload" && !activeImageSrc)}
                className={cn(
                  "btn-purple w-full flex items-center justify-center gap-2 text-xs py-2.5 transition-all cursor-pointer shadow-sm",
                  isPredicting || (inputSource === "upload" && !activeImageSrc) ? "opacity-60 cursor-not-allowed" : ""
                )}
                id="run-predict-btn"
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Inference...
                  </>
                ) : isRoiCropped ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Predict Cropped ROI
                  </>
                ) : inputSource === "webcam" ? (
                  <>
                    <Camera className="h-4 w-4" />
                    Capture &amp; Predict
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Predict Image
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}

        {/* Down arrow */}
        <div className="flex justify-center my-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted/60">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M2 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" />
            </svg>
          </div>
        </div>

        {/* ── Output Results Section ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Output Prediction</p>
            {predictionResult && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {predictionResult.formatted_prediction_time}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* Top prediction highlight badge */}
            {predictionResult && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 border border-purple-200">
                <span className="text-xs font-bold text-purple-900 truncate">
                  {topPredictedName}
                </span>
                <span className="text-xs font-black text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded-full">
                  {predictionResult.confidence.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Confidence bars for all classes */}
            <div className="space-y-1.5 pt-1">
              {mappedPredictions.map((p, i) => (
                <OutputBar key={p.class_id || i} prediction={p} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive ROI Selection Modal */}
      {originalImageSrc && (
        <InteractiveRoiModal
          isOpen={showRoiModal}
          imageSrc={originalImageSrc}
          onClose={() => setShowRoiModal(false)}
          onApplyCrop={handleApplyRoiCrop}
        />
      )}
    </motion.div>
  );
}

function OutputBar({ prediction, index }: { prediction: ClassPrediction; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-2"
    >
      <span className="w-20 flex-shrink-0 text-xs font-semibold truncate text-foreground">
        {prediction.class_name}
      </span>

      <div className="relative flex-1 h-6 overflow-hidden rounded-md bg-slate-100 border border-slate-200">
        <motion.div
          className={cn(
            "absolute left-0 top-0 h-full rounded-md transition-all duration-500",
            prediction.is_highest ? "bg-purple-600 shadow-sm" : "bg-slate-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${prediction.confidence}%` }}
          transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700 tabular-nums">
          {prediction.confidence.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
}
