"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  onUpload: (files: File[]) => Promise<any>;
}

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploadModal({
  isOpen,
  onClose,
  className,
  onUpload,
}: ImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const filterFiles = (files: FileList | File[]) => {
    const valid: File[] = [];
    const invalid: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isValidExt = ["jpg", "jpeg", "png", "webp"].includes(ext || "");
      if (SUPPORTED_TYPES.includes(file.type) || isValidExt) {
        valid.push(file);
      } else {
        invalid.push(file.name);
      }
    });

    if (invalid.length > 0) {
      toast.error(
        `Rejected ${invalid.length} file(s): ${invalid.slice(0, 2).join(", ")}. Supported formats: JPEG, PNG, WEBP.`
      );
    }

    return valid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const valid = filterFiles(e.target.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const valid = filterFiles(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeSelected = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(30);

    try {
      const timer = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + 15));
      }, 100);

      await onUpload(selectedFiles);
      clearInterval(timer);
      setProgress(100);

      setTimeout(() => {
        setUploading(false);
        setSelectedFiles([]);
        setProgress(0);
        onClose();
      }, 400);
    } catch (err: any) {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl"
          style={{ borderColor: "#e2e5f0" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "#e2e5f0" }}>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload Image Samples
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target class: <span className="font-semibold text-foreground">{className}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border/80 hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Click to upload or drag &amp; drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPEG, PNG, WEBP files
            </p>
          </div>

          {/* Selected File List */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Selected ({selectedFiles.length} files):
              </p>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs"
                  style={{ borderColor: "#e2e5f0" }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileImage className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium text-foreground">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelected(idx);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStartUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="btn-purple"
            >
              {uploading ? "Uploading..." : `Upload ${selectedFiles.length} File(s)`}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
