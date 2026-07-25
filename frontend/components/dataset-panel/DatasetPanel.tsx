"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus, Layers } from "lucide-react";
import ClassCard from "./ClassCard";
import { ImageClass } from "@/types";

interface DatasetPanelProps {
  classes: ImageClass[];
  onAddClass: () => void;
  onRenameClass: (id: string, name: string) => void;
  onDeleteClass: (id: string) => void;
  onToggleDisableClass: (id: string, currentDisabled?: boolean) => void;
  onUploadImages: (classId: string, files: File[]) => Promise<any>;
  onCaptureFrame: (classId: string, base64: string) => Promise<any>;
  onDeleteImage: (imageId: string) => void;
  onClearAllImages?: (classId: string) => void;
}

export default function DatasetPanel({
  classes,
  onAddClass,
  onRenameClass,
  onDeleteClass,
  onToggleDisableClass,
  onUploadImages,
  onCaptureFrame,
  onDeleteImage,
  onClearAllImages,
}: DatasetPanelProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Empty State when no classes exist */}
      {classes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center bg-white"
          style={{ borderColor: "#dde2f5" }}
        >
          <Layers className="h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-bold text-foreground">No classes created yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Click the button below to add your first dataset class.
          </p>
        </motion.div>
      )}

      {/* Class Cards */}
      <AnimatePresence initial={false} mode="popLayout">
        {classes.map((cls) => (
          <ClassCard
            key={cls.id}
            imageClass={cls}
            onRename={onRenameClass}
            onDelete={onDeleteClass}
            onToggleDisable={onToggleDisableClass}
            onUploadImages={onUploadImages}
            onCaptureFrame={onCaptureFrame}
            onDeleteImage={onDeleteImage}
            onClearAllImages={onClearAllImages}
            canDelete={classes.length > 2}
          />
        ))}
      </AnimatePresence>


      {/* Add Class Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddClass}
        id="add-class-btn"
        className="w-full rounded-2xl border-2 border-dashed border-border/70 bg-transparent py-4 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary flex items-center justify-center gap-2"
      >
        <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.18 }}>
          <Plus className="h-4 w-4" />
        </motion.div>
        Add a class
      </motion.button>
    </div>
  );
}
