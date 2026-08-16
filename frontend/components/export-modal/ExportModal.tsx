"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, AlertCircle, CheckCircle2, Package, Layers, Calendar, HardDrive, FileCode, Globe, FolderArchive, Code2, Copy, Check } from "lucide-react";
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
  const [showJsSnippet, setShowJsSnippet] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

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
    formats: ["tfjs", "tm", "keras", "savedmodel"],
  };

  function handleDownload(format: "tfjs" | "tm" | "keras" | "savedmodel") {
    setDownloadingFormat(format);
    let downloadUrl = "";
    if (format === "tfjs") {
      downloadUrl = api.getExportTfjsUrl(projectId);
    } else if (format === "tm") {
      downloadUrl = api.getExportTmUrl(projectId);
    } else if (format === "keras") {
      downloadUrl = api.getExportKerasUrl(projectId);
    } else {
      downloadUrl = api.getExportSavedModelUrl(projectId);
    }

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

  const jsSnippetText = `<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>

<script>
  async function predictImage(imgElement) {
    // 1. Load TensorFlow.js model and metadata labels
    const model = await tf.loadLayersModel('model.json');
    const metadata = await fetch('metadata.json').then(res => res.json());
    const labels = metadata.labels;

    // 2. Preprocess input image (224x224, MobileNetV2 scaling [-1, 1])
    const tensor = tf.browser.fromPixels(imgElement)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(127.5)
      .sub(1)
      .expandDims(0);

    // 3. Run model inference
    const predictions = await model.predict(tensor).data();
    const topIdx = predictions.indexOf(Math.max(...predictions));
    
    console.log("Predicted Class:", labels[topIdx]);
  }
</script>`;

  function copySnippet() {
    navigator.clipboard.writeText(jsSnippetText);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl md:max-w-2xl max-h-[85vh] rounded-2xl border bg-white p-6 shadow-2xl flex flex-col"
          style={{ borderColor: "#e2e5f0" }}
        >
          {/* Header (Pinned at top) */}
          <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: "#e2e5f0" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Export Model &amp; Project</h3>
                <p className="text-xs text-muted-foreground font-medium">Download TensorFlow.js, Teachable Machine, Keras, or SavedModel archives</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Inner Body */}
          <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 scrollbar-thin">
            {/* Model Status Banner */}
            <div
              className={`rounded-xl border p-3.5 text-xs leading-relaxed transition-colors ${
                exportInfo.has_model
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                  : "bg-amber-50/80 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {exportInfo.has_model ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {exportInfo.has_model ? "Trained Model Available for Export" : "Dataset Only / Untrained Model"}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5 font-medium">
                    {exportInfo.has_model
                      ? "Package contains model weights, metadata.json, labels.txt, and model files."
                      : "You can export Teachable Machine (.tm) dataset files. Train a model to unlock model packages."}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Metadata Grid */}
            {exportInfo.has_model && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                  <HardDrive className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-muted-foreground uppercase font-bold">Model Size</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{exportInfo.formatted_model_size}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                  <Layers className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-muted-foreground uppercase font-bold">Classes</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{exportInfo.classes_count} Classes</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
                  <Calendar className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-muted-foreground uppercase font-bold">Formats</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">TF.js / Keras / TM</p>
                </div>
              </div>
            )}

            {/* Export Options list */}
            <div className="space-y-3">
              {/* TensorFlow.js (JavaScript) Package */}
              <div className="rounded-xl border border-slate-200 p-4 hover:border-purple-200 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-foreground">TensorFlow.js (JavaScript)</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">Web-ready model.json, weights.bin &amp; metadata.json</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowJsSnippet(!showJsSnippet)}
                      disabled={!exportInfo.has_model}
                      className="h-9 px-3.5 text-xs font-semibold rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer gap-1.5"
                      title="View Code Snippet"
                    >
                      <Code2 className="h-4 w-4" />
                      Snippet
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload("tfjs")}
                      disabled={!exportInfo.has_model || downloadingFormat === "tfjs"}
                      className="btn-violet h-9 px-4 text-xs font-semibold rounded-full gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingFormat === "tfjs" ? "Downloading..." : "Download"}
                    </Button>
                  </div>
                </div>

                {/* JS Snippet Drawer */}
                {showJsSnippet && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 rounded-xl border border-slate-200 bg-slate-900 p-3.5 text-xs font-mono text-slate-200 relative overflow-x-auto"
                  >
                    <button
                      onClick={copySnippet}
                      className="absolute top-3 right-3 rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-sans font-medium cursor-pointer"
                    >
                      {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedSnippet ? "Copied" : "Copy"}
                    </button>
                    <pre className="whitespace-pre">{jsSnippetText}</pre>
                  </motion.div>
                )}
              </div>

              {/* Teachable Machine Project (.tm) Package */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <FolderArchive className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-foreground">Teachable Machine (.tm)</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Complete project dataset archive</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload("tm")}
                  disabled={downloadingFormat === "tm"}
                  className="btn-violet h-9 px-4 text-xs font-semibold rounded-full gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Download className="h-4 w-4" />
                  {downloadingFormat === "tm" ? "Downloading..." : "Download"}
                </Button>
              </div>

              {/* Keras (.keras) Package */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-foreground">Keras Bundle (.zip)</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">Includes keras_model.h5 &amp; labels.txt</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload("keras")}
                  disabled={!exportInfo.has_model || downloadingFormat === "keras"}
                  className="btn-violet h-9 px-4 text-xs font-semibold rounded-full gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Download className="h-4 w-4" />
                  {downloadingFormat === "keras" ? "Downloading..." : "Download"}
                </Button>
              </div>

              {/* TensorFlow SavedModel (.zip) Package */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-foreground">TensorFlow SavedModel (.zip)</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">SavedModel directory structure for TF Serving &amp; C++</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload("savedmodel")}
                  disabled={!exportInfo.has_model || downloadingFormat === "savedmodel"}
                  className="btn-violet h-9 px-4 text-xs font-semibold rounded-full gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Download className="h-4 w-4" />
                  {downloadingFormat === "savedmodel" ? "Downloading..." : "Download"}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer (Pinned at bottom) */}
          <div className="pt-3 border-t shrink-0 flex justify-end" style={{ borderColor: "#e2e5f0" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-5 text-xs font-semibold rounded-full border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
