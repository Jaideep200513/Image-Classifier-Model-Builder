"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Pencil, Trash2, MoreVertical, Check, X, EyeOff, Eye, Maximize2, Eraser } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageClass, ImageItem } from "@/types";
import { cn } from "@/lib/utils";
import { getFullImageUrl } from "@/lib/api";
import WebcamCaptureModal from "./WebcamCaptureModal";
import ImageUploadModal from "./ImageUploadModal";
import ImagePreviewDialog from "./ImagePreviewDialog";

interface ClassCardProps {
  imageClass: ImageClass;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleDisable: (id: string, currentDisabled?: boolean) => void;
  onUploadImages: (classId: string, files: File[]) => Promise<any>;
  onCaptureFrame: (classId: string, base64Image: string) => Promise<any>;
  onDeleteImage: (imageId: string) => void;
  onClearAllImages?: (classId: string) => void;
  canDelete: boolean;
}


export default function ClassCard({
  imageClass,
  onRename,
  onDelete,
  onToggleDisable,
  onUploadImages,
  onCaptureFrame,
  onDeleteImage,
  onClearAllImages,
  canDelete,
}: ClassCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(imageClass.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [showWebcam, setShowWebcam] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImageForPreview, setSelectedImageForPreview] = useState<ImageItem | null>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    setDraftName(imageClass.name);
  }, [imageClass.name]);

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== imageClass.name) onRename(imageClass.id, trimmed);
    else setDraftName(imageClass.name);
    setIsRenaming(false);
  }

  function cancelRename() {
    setDraftName(imageClass.name);
    setIsRenaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") cancelRename();
  }

  const handleReplaceImage = async (imageId: string, newFile: File) => {
    await onDeleteImage(imageId);
    await onUploadImages(imageClass.id, [newFile]);
  };

  const images = imageClass.images || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.96 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "w-full rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden",
        imageClass.disabled ? "bg-muted/60 opacity-60" : "bg-white"
      )}
      style={{ borderColor: imageClass.disabled ? "#d1d5db" : "#e2e5f0" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {/* Color indicator */}
          <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", imageClass.disabled ? "bg-gray-400" : (imageClass.color || "bg-blue-100 text-blue-700").split(" ")[0])} aria-hidden />

          {isRenaming ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitRename}
                className="h-7 flex-1 text-sm font-semibold"
                maxLength={50}
                id={`rename-input-${imageClass.id}`}
              />
              <button onClick={commitRename} className="text-emerald-500 hover:text-emerald-600 transition-colors" aria-label="Confirm">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelRename} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="flex items-center gap-1.5 min-w-0 group/rename"
              id={`rename-btn-${imageClass.id}`}
            >
              <span className={cn("text-sm font-semibold truncate", imageClass.disabled ? "text-muted-foreground line-through" : "text-foreground")}>{imageClass.name}</span>
              {!imageClass.disabled && (
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/rename:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </button>
          )}

          {/* Disabled badge */}
          {imageClass.disabled && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              <EyeOff className="h-2.5 w-2.5" /> Disabled
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none"
            aria-label={`Options for ${imageClass.name}`}
            id={`menu-btn-${imageClass.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsRenaming(true)} className="gap-2 cursor-pointer text-sm">
              <Pencil className="h-3.5 w-3.5" /> Rename Class
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggleDisable(imageClass.id, imageClass.disabled)}
              className="gap-2 cursor-pointer text-sm"
            >
              {imageClass.disabled ? (
                <><Eye className="h-3.5 w-3.5 text-emerald-500" /> Enable Class</>
              ) : (
                <><EyeOff className="h-3.5 w-3.5 text-amber-500" /> Disable Class</>
              )}
            </DropdownMenuItem>
            {images.length > 0 && onClearAllImages && (
              <DropdownMenuItem
                onClick={() => onClearAllImages(imageClass.id)}
                className="gap-2 cursor-pointer text-sm text-amber-600 hover:text-amber-700"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear All Samples
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => canDelete && onDelete(imageClass.id)}
              className={cn("gap-2 cursor-pointer text-sm", canDelete ? "text-destructive" : "pointer-events-none opacity-40")}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Divider ── */}
      <div className="h-px mx-5" style={{ backgroundColor: "#e2e5f0" }} />

      {/* ── Body ── */}
      <div className="flex gap-4 px-5 py-4 items-start">
        {/* Left: label + action buttons */}
        <div className="flex-shrink-0">
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">Add Image Samples:</p>
          <div className="flex flex-col gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWebcam(true)}
                disabled={imageClass.disabled}
                className="gap-2 text-xs w-28 justify-start border-border hover:bg-accent hover:border-primary/40 transition-all"
                id={`webcam-btn-${imageClass.id}`}
              >
                <Camera className="h-3.5 w-3.5 text-primary" />
                Webcam
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(true)}
                disabled={imageClass.disabled}
                className="gap-2 text-xs w-28 justify-start border-border hover:bg-accent hover:border-primary/40 transition-all"
                id={`upload-btn-${imageClass.id}`}
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                Upload
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Right: horizontal thumbnail strip */}
        <div className="flex-1 min-w-0">
          {images.length > 0 ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  {images.length} Image Sample{images.length !== 1 ? "s" : ""}
                </p>
                {onClearAllImages && (
                  <button
                    onClick={() => onClearAllImages(imageClass.id)}
                    className="text-[11px] font-medium text-muted-foreground hover:text-amber-600 flex items-center gap-1 transition-colors"
                    title="Delete all samples in this class"
                  >
                    <Eraser className="h-3 w-3" /> Clear samples
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-hide">
                <AnimatePresence initial={false}>
                  {images.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.2 }}
                      className="group relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border bg-slate-100 cursor-pointer shadow-xs"
                      style={{ borderColor: "#dbe0f0" }}
                      onClick={() => setSelectedImageForPreview(img)}
                    >
                      <img
                        src={getFullImageUrl(img.url)}
                        alt={img.filename}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Hover Overlay with Preview & Delete */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageForPreview(img);
                          }}
                          className="rounded p-1 bg-white/20 text-white hover:bg-white/40 transition-colors"
                          title="Preview"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(img.id);
                          }}
                          className="rounded p-1 bg-rose-500/80 text-white hover:bg-rose-600 transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div
              onClick={() => !imageClass.disabled && setShowUpload(true)}
              className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50"
              style={{ borderColor: "#dde2f5", backgroundColor: "#f4f0ff" }}
            >
              <p className="text-xs font-medium" style={{ color: "#5a5a7a" }}>
                No samples yet — Drop files here or use webcam
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Webcam Modal */}
      <WebcamCaptureModal
        isOpen={showWebcam}
        onClose={() => setShowWebcam(false)}
        className={imageClass.name}
        onCaptureFrame={(base64) => onCaptureFrame(imageClass.id, base64)}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        className={imageClass.name}
        onUpload={(files) => onUploadImages(imageClass.id, files)}
      />

      {/* Fullscreen Image Preview Dialog */}
      <ImagePreviewDialog
        isOpen={!!selectedImageForPreview}
        imageItem={selectedImageForPreview}
        onClose={() => setSelectedImageForPreview(null)}
        onDelete={onDeleteImage}
        onReplace={handleReplaceImage}
      />
    </motion.div>
  );
}
