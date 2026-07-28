"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Download, Settings, Info, Edit2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DatasetPanel from "@/components/dataset-panel/DatasetPanel";
import TrainingPanel from "@/components/training-panel/TrainingPanel";
import PreviewPanel from "@/components/preview-panel/PreviewPanel";
import ConfirmLeaveModal from "@/components/dataset-panel/ConfirmLeaveModal";
import ExportModal from "@/components/export-modal/ExportModal";
import ProjectInfoModal from "@/components/project-modal/ProjectInfoModal";
import { useProjectData } from "@/hooks/useProjectData";
import { api } from "@/lib/api";

const DEFAULT_PROJECT_ID = "default-project";

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");

  const handleSaveProjectName = async () => {
    const clean = projectNameInput.trim();
    if (!clean) {
      setIsEditingProjectName(false);
      return;
    }
    try {
      await api.updateProject(DEFAULT_PROJECT_ID, { name: clean });
      queryClient.invalidateQueries({ queryKey: ["project", DEFAULT_PROJECT_ID] });
      toast.success("Project renamed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to rename project");
    } finally {
      setIsEditingProjectName(false);
    }
  };

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

  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Trap browser back button to show ConfirmLeaveModal
    window.history.pushState({ page: "workspace" }, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState({ page: "workspace" }, "", window.location.href);
      setShowLeaveModal(true);
    };

    // 2. Trap browser tab reload & close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Going back or reloading will permanently erase all uploaded image samples and trained models.";
      return e.returnValue;
    };

    // 3. Send beacon to reset backend data if tab is closed or reloaded
    const handlePageHide = () => {
      const resetUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/projects/${DEFAULT_PROJECT_ID}/reset`;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(resetUrl);
      } else {
        fetch(resetUrl, { method: "POST", keepalive: true }).catch(() => {});
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);



  const handleConfirmLeaveAndErase = async () => {
    setIsResetting(true);
    try {
      await resetProject();
      queryClient.invalidateQueries({ queryKey: ["trainingStatus", DEFAULT_PROJECT_ID] });
      queryClient.invalidateQueries({ queryKey: ["modelStatus", DEFAULT_PROJECT_ID] });
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
          {isEditingProjectName ? (
            <div className="flex items-center gap-1">
              <Input
                value={projectNameInput}
                onChange={(e) => setProjectNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProjectName();
                  if (e.key === "Escape") setIsEditingProjectName(false);
                }}
                autoFocus
                className="h-7 text-xs font-semibold px-2 w-36 sm:w-48 bg-white border-purple-300 focus-visible:ring-purple-400"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveProjectName}
                className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 group cursor-pointer"
              onClick={() => {
                setProjectNameInput(project?.name || "Image Project");
                setIsEditingProjectName(true);
              }}
              title="Click to rename project"
            >
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                {project?.name || "Image Project"}
              </span>
              <Edit2 className="h-3 w-3 text-muted-foreground/60 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProjectInfoModal(true)}
            className="hidden gap-1.5 text-xs sm:flex cursor-pointer border-slate-200"
            id="project-info-btn"
          >
            <Info className="h-3.5 w-3.5" />
            Project Info
          </Button>

          <Button
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="btn-purple gap-1.5 text-xs flex cursor-pointer"
            id="export-model-btn"
          >
            <Download className="h-3.5 w-3.5" />
            Export Model
          </Button>
        </div>
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
            className="flex h-full w-72 flex-shrink-0 flex-col overflow-y-auto p-4 pt-6 pb-12"
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
            className="flex h-full w-80 flex-shrink-0 flex-col overflow-y-auto p-4 pt-6 pb-12"
          >
            <PreviewPanel classes={classes} />
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
          <PreviewPanel classes={classes} />
        </div>
      </div>

      {/* Confirmation Leave Modal */}
      <ConfirmLeaveModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleConfirmLeaveAndErase}
        isResetting={isResetting}
      />

      {/* Model Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Project Info & Settings Modal */}
      <ProjectInfoModal
        isOpen={showProjectInfoModal}
        onClose={() => setShowProjectInfoModal(false)}
        onProjectUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["project", DEFAULT_PROJECT_ID] });
        }}
      />
    </div>
  );
}
