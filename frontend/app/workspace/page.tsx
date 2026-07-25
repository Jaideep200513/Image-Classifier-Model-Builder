"use client";

import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import DatasetPanel from "@/components/dataset-panel/DatasetPanel";
import TrainingPanel from "@/components/training-panel/TrainingPanel";
import PreviewPanel from "@/components/preview-panel/PreviewPanel";
import ConfirmLeaveModal from "@/components/dataset-panel/ConfirmLeaveModal";
import { useProjectData } from "@/hooks/useProjectData";

// Horizontal arrow connector between panels
function FlowConnector() {
  return (
    <div className="hidden lg:flex flex-shrink-0 self-center items-center" style={{ marginTop: "-48px" }}>
      <div className="w-6 h-px" style={{ backgroundColor: "#c4b5fd" }} />
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#c4b5fd" }}>
        <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const {
    project,
    isLoading,
    addClass,
    renameClass,
    deleteClass,
    toggleDisableClass,
    uploadImages,
    captureImage,
    deleteImage,
    clearClassImages,
    resetProject,
  } = useProjectData();

  const classes = project?.classes || [];

  const handleConfirmLeaveAndErase = async () => {
    setIsResetting(true);
    try {
      await resetProject();
      setShowLeaveModal(false);
      router.push("/new-project");
    } catch {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: "#eef0f8" }}>

      {/* ── Topbar ── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex h-14 flex-shrink-0 items-center justify-between border-b px-5 bg-white"
        style={{ borderColor: "#e2e5f0" }}
      >
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.93 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLeaveModal(true)}
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Back to New Project"
              id="back-to-new-project-btn"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </motion.div>

          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center flex-shrink-0 rounded-full"
              style={{ background: "#5f79ff" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="8" cy="8" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="8" cy="8" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="hidden text-sm font-bold text-foreground sm:block" style={{ fontFamily: "'Inter', sans-serif" }}>ModelForge</span>
          </div>
          <span className="text-muted-foreground/40 select-none">/</span>
          <span className="text-sm text-muted-foreground">{project?.name || "Image Project"}</span>
          <span
            className="hidden rounded-full px-2.5 py-0.5 text-[10px] font-semibold border sm:inline-flex"
            style={{ backgroundColor: "#f5f5f5", borderColor: "#e5e7eb", color: "#5f79ff" }}
          >
            Phase 2
          </span>

        </div>
        <Button variant="outline" size="sm" className="hidden gap-1.5 text-xs sm:flex" disabled id="save-project-btn">
          <Save className="h-3.5 w-3.5" />
          Save Project
        </Button>
      </motion.header>

      {/* ── Full-width canvas ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop 3-col layout */}
        <div className="hidden lg:flex w-full items-start gap-0 overflow-hidden">

          {/* LEFT: Dataset — scrollable, flex-1 */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, ease: "easeOut", delay: 0.05 }}
            className="flex h-full flex-1 min-w-0 flex-col overflow-y-auto p-6"
          >
            {isLoading ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                Loading project dataset...
              </div>
            ) : (
              <DatasetPanel
                classes={classes}
                onAddClass={() => addClass()}
                onRenameClass={renameClass}
                onDeleteClass={deleteClass}
                onToggleDisableClass={toggleDisableClass}
                onUploadImages={uploadImages}
                onCaptureFrame={captureImage}
                onDeleteImage={deleteImage}
                onClearAllImages={clearClassImages}
              />
            )}
          </motion.div>

          {/* Flow connector */}
          <FlowConnector />

          {/* CENTER: Training — fixed width, scrollable */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut", delay: 0.18 }}
            className="flex h-full w-56 flex-shrink-0 flex-col overflow-y-auto p-6 pt-12"
          >
            <TrainingPanel classes={classes} />
          </motion.div>

          {/* Flow connector */}
          <FlowConnector />

          {/* RIGHT: Preview — fixed width, scrollable */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, ease: "easeOut", delay: 0.3 }}
            className="flex h-full w-80 flex-shrink-0 flex-col overflow-y-auto p-6 pt-8"
          >
            <PreviewPanel />
          </motion.div>
        </div>

        {/* Mobile: single scrollable column */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:hidden">
          <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e2e5f0" }}>
            <DatasetPanel
              classes={classes}
              onAddClass={() => addClass()}
              onRenameClass={renameClass}
              onDeleteClass={deleteClass}
              onToggleDisableClass={toggleDisableClass}
              onUploadImages={uploadImages}
              onCaptureFrame={captureImage}
              onDeleteImage={deleteImage}
              onClearAllImages={clearClassImages}
            />
          </div>

          <TrainingPanel classes={classes} />
          <PreviewPanel />
        </div>
      </div>

      {/* Confirmation Leave Modal */}
      <ConfirmLeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleConfirmLeaveAndErase}
        isResetting={isResetting}
      />
    </div>
  );
}
