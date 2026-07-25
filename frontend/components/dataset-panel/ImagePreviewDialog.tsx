"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageItem } from "@/types";
import { getFullImageUrl } from "@/lib/api";

interface ImagePreviewDialogProps {
  imageItem: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (imageId: string) => void;
  onReplace: (imageId: string, newFile: File) => void;
}

export default function ImagePreviewDialog({
  imageItem,
  isOpen,
  onClose,
  onDelete,
  onReplace,
}: ImagePreviewDialogProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !imageItem) return null;

  const fullUrl = getFullImageUrl(imageItem.url);

  const handleFileReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onReplace(imageItem.id, e.target.files[0]);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl rounded-2xl border bg-white p-5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ borderColor: "#e2e5f0" }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "#e2e5f0" }}>
            <div className="min-w-0 pr-4">
              <h4 className="text-sm font-semibold text-foreground truncate">{imageItem.filename}</h4>
              <p className="text-[11px] text-muted-foreground">Sample ID: {imageItem.id}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Image Display */}
          <div className="my-4 flex-1 overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center min-h-[260px] max-h-[60vh]">
            <img
              src={fullUrl}
              alt={imageItem.filename}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Hidden Replace Input */}
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileReplace}
            className="hidden"
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#e2e5f0" }}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(imageItem.id);
                onClose();
              }}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Sample
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => replaceInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace Image
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
