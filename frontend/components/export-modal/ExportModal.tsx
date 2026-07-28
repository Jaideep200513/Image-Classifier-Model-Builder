"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, AlertCircle, CheckCircle2, Package, Layers, Calendar, HardDrive, FileCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ExportInfo } from "@/types";

const DEFAULT_PROJECT_ID = "default-project";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export default function ExportModal({
  isOpen,
  onClose,
  projectId = DEFAULT_PROJECT_ID,
}: ExportModalProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const exportInfoQuery = useQuery<ExportInfo, Error>({
    queryKey: ["exportInfo", projectId],
    queryFn: () => api.getExportInfo(projectId),
    enabled: isOpen,
    staleTime: 5000,
  });

  if (!isOpen) return null;

  const exportInfo = exportInfoQuery.data || {
    has_model: false,
    formatted_model_size: "0 KB",
    classes_count: 0,
    formats: ["keras", "savedmodel"],
  };

  function handleDownload(format: "keras" | "savedmodel") {
    setDownloadingFormat(format);
    const downloadUrl =
      format === "keras"
        ? api.getExportKerasUrl(projectId)
        : api.getExportSavedModelUrl(projectId);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingFormat(null);
    }, 1500);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl overflow-hidden flex flex-col"
          style={{ borderColor: "#e2e5f0" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Export Model</h3>
              <p className="text-xs text-muted-foreground">Download trained MobileNetV2 package</p>
            </div>
          </div>

          {/* Model Status Banner */}
          <div
            className={`mt-4 rounded-xl border p-3 text-xs leading-relaxed transition-colors ${
              exportInfo.has_model
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {exportInfo.has_model ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-xs">
                  {exportInfo.has_model ? "Trained Model Available for Export" : "No Model Available"}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {exportInfo.has_model
                    ? "Package contains model weights, classes.json, and training metadata."
                    : "Please train a model in Phase 3 before exporting."}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Metadata Grid */}
          {exportInfo.has_model && (
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-center">
                <HardDrive className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Model Size</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{exportInfo.formatted_model_size}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-center">
                <Layers className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Classes</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{exportInfo.classes_count} Classes</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 text-center">
                <Calendar className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Format</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">TensorFlow 2.x</p>
              </div>
            </div>
          )}

          {/* Export Options list */}
          <div className="mt-5 space-y-3">
            {/* Keras (.keras) Package */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Keras Bundle (.zip)</h4>
                  <p className="text-[11px] text-muted-foreground">Includes model.keras, classes.json &amp; python guide</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleDownload("keras")}
                disabled={!exportInfo.has_model || downloadingFormat === "keras"}
                className="btn-purple text-xs gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingFormat === "keras" ? "Downloading..." : "Download"}
              </Button>
            </div>

            {/* TensorFlow SavedModel (.zip) Package */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileCode className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">TensorFlow SavedModel (.zip)</h4>
                  <p className="text-[11px] text-muted-foreground">SavedModel directory structure for TF Serving &amp; C++</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload("savedmodel")}
                disabled={!exportInfo.has_model || downloadingFormat === "savedmodel"}
                className="text-xs gap-1.5 cursor-pointer border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingFormat === "savedmodel" ? "Downloading..." : "Download"}
              </Button>
            </div>
          </div>

          {/* Footer close */}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
