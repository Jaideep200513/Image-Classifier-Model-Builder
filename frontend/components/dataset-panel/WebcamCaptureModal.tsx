"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, X, RefreshCw, Radio, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageItem } from "@/types";

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  onCaptureFrame: (base64Image: string) => Promise<ImageItem>;
}

export default function WebcamCaptureModal({
  isOpen,
  onClose,
  className,
  onCaptureFrame,
}: WebcamCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Notify other components (e.g., PreviewPanel) to release camera
      window.dispatchEvent(new CustomEvent("webcam-modal-open"));

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } },
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: unknown) {
        const error = err as { name?: string };
        // Retry with basic video constraints if overconstrained or busy
        if (error.name === "NotReadableError" || error.name === "OverconstrainedError") {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw err;
        }
      }

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Fetch available devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);

      const activeTrack = mediaStream.getVideoTracks()[0];
      if (activeTrack) {
        const settings = activeTrack.getSettings();
        setCurrentDeviceId(settings.deviceId || null);
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      setHasPermission(false);
      if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setCameraError("Camera is currently in use by another application or tab.");
        toast.error("Camera in use by another application.");
      } else {
        setCameraError("Camera access denied or unavailable.");
        toast.error("Camera access denied or unavailable.");
      }
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    setIsRecording(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    window.dispatchEvent(new CustomEvent("webcam-modal-close"));
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const switchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    if (nextDevice) {
      startCamera(nextDevice.deviceId);
    }
  };

  const captureSingleFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    try {
      await onCaptureFrame(dataUrl);
      setCapturedCount((prev) => prev + 1);
    } catch {}
  }, [onCaptureFrame]);

  // Hold to Record handler
  const startRecording = () => {
    if (!stream || !hasPermission) return;
    setIsRecording(true);
    // Immediately capture first frame
    captureSingleFrame();

    // Repeat every ~250ms (captures ~4 images per second)
    recordIntervalRef.current = setInterval(() => {
      captureSingleFrame();
    }, 250);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl"
          style={{ borderColor: "#e2e5f0" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "#e2e5f0" }}>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Capture Webcam Samples
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Adding to <span className="font-bold text-foreground">{className}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Video Preview */}
          <div className="relative mt-4 overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center">
            {hasPermission === false ? (
              <div className="p-6 text-center text-white space-y-2">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                <p className="text-base font-semibold">Camera Unavailable</p>
                <p className="text-sm text-gray-300 max-w-xs mx-auto">
                  {cameraError || "Camera is in use by another application or permission was denied."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startCamera()}
                  className="mt-2 text-sm border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Camera
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />
                {/* Live recording indicator */}
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-rose-500/90 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md animate-pulse">
                    <Radio className="h-4 w-4" />
                    Recording... ({capturedCount} captured)
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-between">
            {/* Switch Camera */}
            {devices.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                disabled={!hasPermission}
                className="gap-1.5 text-sm font-medium cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Switch Camera
              </Button>
            )}

            {/* Hold to record button */}
            <div className="mx-auto flex flex-col items-center gap-1.5">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={!hasPermission}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-transform active:scale-95 ${
                  isRecording
                    ? "bg-rose-500 ring-4 ring-rose-200"
                    : "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                } ${!hasPermission ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Camera className="h-7 w-7 text-white" />
              </button>
              <span className="text-xs font-semibold text-muted-foreground select-none">
                {isRecording ? "Release to stop" : "Hold to Record"}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} className="text-sm font-medium cursor-pointer">
              Done ({capturedCount})
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
