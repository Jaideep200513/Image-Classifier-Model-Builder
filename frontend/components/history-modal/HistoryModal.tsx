"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  History,
  Search,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  X,
  Sparkles,
  Layers,
  Activity,
  Download,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Package,
  Boxes,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api";
import { ProjectHistoryItem } from "@/types";
import { toast } from "sonner";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectHistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "classes" | "export">("analytics");

  const { data: projects = [], isLoading, refetch } = useQuery<ProjectHistoryItem[]>({
    queryKey: ["allProjectsHistory"],
    queryFn: () => api.getAllProjects(),
    enabled: isOpen,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: (_, deletedId) => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["allProjectsHistory"] });
      if (selectedProject?.id === deletedId) {
        setSelectedProject(null);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete project");
    },
  });

  if (!isOpen) return null;

  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredProjects = projects.filter((p) => {
    if (!cleanQuery) return true;
    const nameMatch = (p.name || "").toLowerCase().includes(cleanQuery);
    const idMatch = (p.id || "").toLowerCase().includes(cleanQuery);
    const descMatch = (p.description || "").toLowerCase().includes(cleanQuery);
    const classMatch = (p.classes || []).some((c) =>
      (c.name || "").toLowerCase().includes(cleanQuery)
    );
    return nameMatch || idMatch || descMatch || classMatch;
  });

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return { date: "N/A", time: "" };
    try {
      const d = new Date(isoString);
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return { date, time };
    } catch {
      return { date: isoString, time: "" };
    }
  };

  const handleOpenWorkspace = (projectId: string) => {
    onClose();
    router.push(`/workspace?projectId=${projectId}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
        >
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Project History &amp; Analytics
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
                    {projects.length} Saved
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  Inspect creation date, model metrics, trained classes, and export options.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh history list"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Modal Content Body ── */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* ── Left Column: Master Project List ── */}
            <div className="w-full md:w-5/12 border-r border-gray-100 flex flex-col bg-gray-50/30">
              {/* Search Bar */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, class, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Projects List Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(90vh-140px)]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mb-2" />
                    <span className="text-xs">Loading project history...</span>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-10 px-4 text-gray-400">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">No projects found.</p>
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const created = formatDateTime(p.created_at);
                    const isSelected = selectedProject?.id === p.id;
                    const valAcc = p.metrics?.val_accuracy != null ? (p.metrics.val_accuracy * 100).toFixed(1) : null;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProject(p)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-violet-50/80 border-violet-300 shadow-xs"
                            : "bg-white border-gray-200 hover:border-violet-200 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-sm font-bold text-gray-900 truncate flex-1">
                            {p.name}
                          </h3>

                          {p.has_trained_model ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3" />
                              {valAcc ? `${valAcc}% Acc` : "Trained"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                              Untrained
                            </span>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {created.date}
                          </span>
                          {created.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {created.time}
                            </span>
                          )}
                        </div>

                        {/* Badges & Actions Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{p.classes_count} Classes</span>
                            <span>•</span>
                            <span>{p.total_images_count} Samples</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWorkspace(p.id);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 rounded-md transition-colors flex items-center gap-1"
                              title="Open project in workspace"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete project "${p.name}" permanently?`)) {
                                  deleteProjectMutation.mutate(p.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Right Column: Selected Project Detail Inspection Panel ── */}
            <div className="w-full md:w-7/12 flex flex-col bg-white overflow-y-auto max-h-[calc(90vh-140px)]">
              {selectedProject ? (
                <div className="p-6 space-y-6">
                  {/* Selected Project Banner */}
                  <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">{selectedProject.name}</h3>
                        {selectedProject.has_trained_model && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            Trained Model Ready
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{selectedProject.id}</code></span>
                        <span>•</span>
                        <span>Created: {formatDateTime(selectedProject.created_at).date} {formatDateTime(selectedProject.created_at).time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenWorkspace(selectedProject.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      Workspace <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inspection Navigation Tabs */}
                  <div className="flex border-b border-gray-200 gap-6">
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === "analytics"
                          ? "border-violet-600 text-violet-600"
                          : "border-transparent text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      <Activity className="h-4 w-4" /> Metrics &amp; Analytics
                    </button>

                    <button
                      onClick={() => setActiveTab("classes")}
                      className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === "classes"
                          ? "border-violet-600 text-violet-600"
                          : "border-transparent text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      <Layers className="h-4 w-4" /> Classes ({selectedProject.classes_count})
                    </button>

                    <button
                      onClick={() => setActiveTab("export")}
                      className={`pb-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                        activeTab === "export"
                          ? "border-violet-600 text-violet-600"
                          : "border-transparent text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      <Download className="h-4 w-4" /> Model Export
                    </button>
                  </div>

                  {/* Tab 1: Metrics & Analytics */}
                  {activeTab === "analytics" && (
                    <div className="space-y-5">
                      {selectedProject.metrics ? (
                        <>
                          {/* Top Metric Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
                              <span className="text-xs text-emerald-600 font-medium block">Val Accuracy</span>
                              <span className="text-lg font-bold text-emerald-700">
                                {(selectedProject.metrics.val_accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
                              <span className="text-xs text-blue-600 font-medium block">Train Accuracy</span>
                              <span className="text-lg font-bold text-blue-700">
                                {(selectedProject.metrics.train_accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
                              <span className="text-xs text-purple-600 font-medium block">Val Loss</span>
                              <span className="text-lg font-bold text-purple-700">
                                {selectedProject.metrics.val_loss.toFixed(4)}
                              </span>
                            </div>
                            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
                              <span className="text-xs text-amber-600 font-medium block">Duration</span>
                              <span className="text-lg font-bold text-amber-700">
                                {selectedProject.metrics.formatted_duration || `${selectedProject.metrics.duration_seconds}s`}
                              </span>
                            </div>
                          </div>

                          {/* Under the Hood Breakdown if available */}
                          {selectedProject.under_the_hood && (
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Under the Hood Breakdown
                              </h4>

                              {/* Per-Class Accuracy Bars */}
                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
                                <span className="text-xs font-semibold text-gray-800 block">Class Accuracy Breakdown</span>
                                {selectedProject.under_the_hood.accuracy_per_class.map((cStat, i) => (
                                  <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                      <span className="text-gray-700">{cStat.class_name}</span>
                                      <span className="text-gray-900 font-bold">{(cStat.accuracy * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-violet-600 rounded-full"
                                        style={{ width: `${cStat.accuracy * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Confusion Matrix Table if available */}
                              {selectedProject.under_the_hood.confusion_matrix && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                  <span className="text-xs font-semibold text-gray-800 block">Confusion Matrix</span>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-center text-xs">
                                      <thead>
                                        <tr>
                                          <th className="p-1.5 text-left text-gray-500 font-medium">True \ Pred</th>
                                          {selectedProject.under_the_hood.confusion_matrix.classes.map((cls, idx) => (
                                            <th key={idx} className="p-1.5 text-gray-700 font-bold">{cls}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedProject.under_the_hood.confusion_matrix.matrix.map((row, rIdx) => (
                                          <tr key={rIdx} className="border-t border-gray-200">
                                            <td className="p-1.5 font-bold text-left text-gray-700">
                                              {selectedProject.under_the_hood?.confusion_matrix.classes[rIdx]}
                                            </td>
                                            {row.map((val, cIdx) => (
                                              <td
                                                key={cIdx}
                                                className={`p-1.5 font-semibold ${
                                                  rIdx === cIdx ? "bg-emerald-100 text-emerald-800" : "text-gray-500"
                                                }`}
                                              >
                                                {val}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                          <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2 opacity-80" />
                          <p className="text-xs font-bold text-gray-800">No Trained Model Found</p>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            This project has not been trained yet. Train a model in the workspace to view accuracy metrics and Under the Hood analytics.
                          </p>
                          <button
                            onClick={() => handleOpenWorkspace(selectedProject.id)}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs"
                          >
                            Open Workspace to Train
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Classes Breakdown */}
                  {activeTab === "classes" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedProject.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="h-4 w-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cls.color || "#5f79ff" }}
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900 block">{cls.name}</span>
                                <span className="text-xs text-gray-500">{cls.image_count} image samples</span>
                              </div>
                            </div>

                            {cls.disabled && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Model Export */}
                  {activeTab === "export" && (
                    <div className="space-y-4">
                      {selectedProject.has_trained_model ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Keras Export Card */}
                          <a
                            href={api.getExportKerasUrl(selectedProject.id)}
                            download
                            className="p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-3 group"
                          >
                            <div className="p-2.5 rounded-lg bg-violet-100 text-violet-700 group-hover:scale-105 transition-transform">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                Keras Model (.zip) <Download className="h-3.5 w-3.5 text-violet-600" />
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                `model.keras` bundle with class mapping &amp; Python loader guide.
                              </p>
                            </div>
                          </a>

                          {/* TF.js Export Card */}
                          <a
                            href={api.getExportTfjsUrl(selectedProject.id)}
                            download
                            className="p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-3 group"
                          >
                            <div className="p-2.5 rounded-lg bg-orange-100 text-orange-700 group-hover:scale-105 transition-transform">
                              <FileCode className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                TensorFlow.js Package <Download className="h-3.5 w-3.5 text-orange-600" />
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                `model.json` web bundle with interactive web runner HTML page.
                              </p>
                            </div>
                          </a>

                          {/* SavedModel Export Card */}
                          <a
                            href={api.getExportSavedModelUrl(selectedProject.id)}
                            download
                            className="p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-3 group"
                          >
                            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                              <Boxes className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                SavedModel Directory <Download className="h-3.5 w-3.5 text-blue-600" />
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Production TF Serving directory with `saved_model.pb`.
                              </p>
                            </div>
                          </a>

                          {/* Teachable Machine Archive Export Card */}
                          <a
                            href={api.getExportTmUrl(selectedProject.id)}
                            download
                            className="p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-3 group"
                          >
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                Teachable Machine (.tm) <Download className="h-3.5 w-3.5 text-emerald-600" />
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Portable project archive to import dataset &amp; settings back anytime.
                              </p>
                            </div>
                          </a>
                        </div>
                      ) : (
                        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                          <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2 opacity-80" />
                          <p className="text-xs font-bold text-gray-800">Export Unavailable</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Train a model for this project first to enable model downloads.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                  <BarChart2 className="h-12 w-12 text-gray-300 mb-3" />
                  <h4 className="text-sm font-bold text-gray-700">Select a Project to Inspect</h4>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Click any project from the left history list to inspect its creation time, accuracy details, trained classes, and export options.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
