"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  Sparkles,
  Layers,
  Activity,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Package,
  Boxes,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { ProjectHistoryItem, EpochMetric } from "@/types";
import { toast } from "sonner";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;

  const [activeTab, setActiveTab] = useState<"analytics" | "classes" | "export">("analytics");

  // Fetch all projects to find target project
  const { data: projects = [], isLoading, refetch } = useQuery<ProjectHistoryItem[]>({
    queryKey: ["allProjectsHistory"],
    queryFn: () => api.getAllProjects(),
  });

  const project = projects.find((p) => p.id === projectId);

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["allProjectsHistory"] });
      router.push("/history");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete project");
    },
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

  const handleOpenWorkspace = () => {
    router.push(`/workspace?projectId=${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-foreground">
        <Navbar />
        <main className="flex flex-1 items-center justify-center pt-32 pb-12">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin text-violet-600" />
            <span className="text-sm font-semibold">Loading project details...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-foreground">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center pt-32 pb-12 px-4 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Project Not Found</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            The requested project ID <code className="bg-gray-100 px-1.5 py-0.5 rounded">{projectId}</code> does not exist or has been deleted.
          </p>
          <Link href="/history" className="mt-5">
            <button className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-xs flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to History
            </button>
          </Link>
        </main>
      </div>
    );
  }

  const created = formatDateTime(project.created_at);
  const valAcc = project.metrics?.val_accuracy != null ? (project.metrics.val_accuracy * 100).toFixed(1) : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground">
      {/* Floating Navbar */}
      <Navbar />

      <main className="flex flex-1 flex-col px-4 pt-32 pb-16 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Top Breadcrumb Navigation & Action Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-violet-600 transition-colors self-start"
          >
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm(`Delete project "${project.name}" permanently?`)) {
                  deleteProjectMutation.mutate(project.id);
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Delete Project
            </button>

            <button
              onClick={handleOpenWorkspace}
              className="btn-violet text-xs px-4 py-2 flex items-center gap-2"
            >
              Open Workspace <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 sm:p-8 space-y-6"
        >
          {/* Project Title Header Banner */}
          <div className="pb-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{project.name}</h1>
                {project.has_trained_model ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {valAcc ? `${valAcc}% Acc` : "Trained Model Ready"}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    Untrained
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{project.id}</code>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" /> {created.date}
                </span>
                {created.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" /> {created.time}
                  </span>
                )}
                <span>•</span>
                <span className="font-semibold text-gray-700">{project.classes_count} Classes</span>
                <span>•</span>
                <span>{project.total_images_count} Samples</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "analytics"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Activity className="h-4 w-4" /> Metrics &amp; Analytics
            </button>

            <button
              onClick={() => setActiveTab("classes")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "classes"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Layers className="h-4 w-4" /> Classes ({project.classes_count})
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
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
            <div className="space-y-6">
              {project.metrics ? (
                <>
                  {/* Top Metric Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center">
                      <span className="text-xs text-emerald-600 font-medium block">Val Accuracy</span>
                      <span className="text-2xl font-extrabold text-emerald-700">
                        {(project.metrics.val_accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-center">
                      <span className="text-xs text-blue-600 font-medium block">Train Accuracy</span>
                      <span className="text-2xl font-extrabold text-blue-700">
                        {(project.metrics.train_accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl text-center">
                      <span className="text-xs text-purple-600 font-medium block">Val Loss</span>
                      <span className="text-2xl font-extrabold text-purple-700">
                        {project.metrics.val_loss.toFixed(4)}
                      </span>
                    </div>
                    <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-center">
                      <span className="text-xs text-amber-600 font-medium block">Duration</span>
                      <span className="text-2xl font-extrabold text-amber-700">
                        {project.metrics.formatted_duration || `${project.metrics.duration_seconds}s`}
                      </span>
                    </div>
                  </div>

                  {/* Under the Hood Breakdown if available */}
                  {project.under_the_hood && (
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Under the Hood Performance Analytics
                      </h3>

                      {/* 2 Epoch Line Charts Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {project.under_the_hood.accuracy_per_epoch && (
                          <LineChartCard
                            title="Accuracy per epoch"
                            tooltipTitle="Accuracy"
                            tooltipDesc="Accuracy is the percentage of classifications that a model gets right during training."
                            yTitle="Accuracy"
                            data={project.under_the_hood.accuracy_per_epoch}
                            y1Key="accuracy"
                            y1Label="acc"
                            y2Key="val_accuracy"
                            y2Label="test"
                            yMin={0}
                            yMax={1.0}
                          />
                        )}

                        {project.under_the_hood.loss_per_epoch && (
                          <LineChartCard
                            title="Loss per epoch"
                            tooltipTitle="Loss"
                            tooltipDesc="Loss measures how far the model's predictions are from the true labels. Lower loss values mean better model predictions."
                            yTitle="Loss"
                            data={project.under_the_hood.loss_per_epoch}
                            y1Key="loss"
                            y1Label="loss"
                            y2Key="val_loss"
                            y2Label="test loss"
                            yMin={0}
                            yMax={Math.max(
                              0.6,
                              ...project.under_the_hood.loss_per_epoch.map((d) => Math.max(d.loss || 0, d.val_loss || 0))
                            )}
                          />
                        )}
                      </div>

                      {/* Per-Class Accuracy Bars */}
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                        <span className="text-xs font-bold text-gray-800 block">Class Accuracy Breakdown</span>
                        {project.under_the_hood.accuracy_per_class.map((cStat, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-gray-700">{cStat.class_name}</span>
                              <span className="text-gray-900 font-bold">{(cStat.accuracy * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-600 rounded-full"
                                style={{ width: `${cStat.accuracy * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Confusion Matrix Table if available */}
                      {project.under_the_hood.confusion_matrix && (
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                          <span className="text-xs font-bold text-gray-800 block">Confusion Matrix</span>
                          <div className="overflow-x-auto">
                            <table className="w-full text-center text-xs">
                              <thead>
                                <tr>
                                  <th className="p-2.5 text-left text-gray-500 font-medium">True \ Pred</th>
                                  {project.under_the_hood.confusion_matrix.classes.map((cls, idx) => (
                                    <th key={idx} className="p-2.5 text-gray-700 font-bold">{cls}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {project.under_the_hood.confusion_matrix.matrix.map((row, rIdx) => (
                                  <tr key={rIdx} className="border-t border-gray-200">
                                    <td className="p-2.5 font-bold text-left text-gray-700">
                                      {project.under_the_hood?.confusion_matrix.classes[rIdx]}
                                    </td>
                                    {row.map((val, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className={`p-2.5 font-bold rounded ${
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
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                  <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-2.5 opacity-80" />
                  <h4 className="text-sm font-bold text-gray-800">No Trained Model Available</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    This project has not been trained yet. Open the workspace to upload samples and train a MobileNetV2 model.
                  </p>
                  <button
                    onClick={handleOpenWorkspace}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-xs"
                  >
                    Open Workspace to Train
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Classes Breakdown */}
          {activeTab === "classes" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {project.classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl border border-gray-200 flex items-center justify-between bg-white shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-5 w-5 rounded-full flex-shrink-0"
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
              {project.has_trained_model ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Keras Export Card */}
                  <a
                    href={api.getExportKerasUrl(project.id)}
                    download
                    className="p-5 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-4 group"
                  >
                    <div className="p-3 rounded-xl bg-violet-100 text-violet-700 group-hover:scale-105 transition-transform">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        Keras Model (.zip) <Download className="h-4 w-4 text-violet-600" />
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        `model.keras` bundle with class mapping &amp; Python loader guide.
                      </p>
                    </div>
                  </a>

                  {/* TF.js Export Card */}
                  <a
                    href={api.getExportTfjsUrl(project.id)}
                    download
                    className="p-5 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-4 group"
                  >
                    <div className="p-3 rounded-xl bg-orange-100 text-orange-700 group-hover:scale-105 transition-transform">
                      <FileCode className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        TensorFlow.js Package <Download className="h-4 w-4 text-orange-600" />
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        `model.json` web bundle with interactive web runner HTML page.
                      </p>
                    </div>
                  </a>

                  {/* SavedModel Export Card */}
                  <a
                    href={api.getExportSavedModelUrl(project.id)}
                    download
                    className="p-5 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-4 group"
                  >
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                      <Boxes className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        SavedModel Directory <Download className="h-4 w-4 text-blue-600" />
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Production TF Serving directory with `saved_model.pb`.
                      </p>
                    </div>
                  </a>

                  {/* Teachable Machine Archive Export Card */}
                  <a
                    href={api.getExportTmUrl(project.id)}
                    download
                    className="p-5 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all flex items-start gap-4 group"
                  >
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        Teachable Machine (.tm) <Download className="h-4 w-4 text-emerald-600" />
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Portable project archive to import dataset &amp; settings back anytime.
                      </p>
                    </div>
                  </a>
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                  <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-2.5 opacity-80" />
                  <h4 className="text-sm font-bold text-gray-800">Export Unavailable</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Train a model for this project first to enable model downloads.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function InfoTooltip({ title, description }: { title: string; description: string }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
      {show && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl pointer-events-none leading-relaxed transition-all animate-in fade-in-50 zoom-in-95">
          <p className="font-bold text-white mb-1 border-b border-slate-700/80 pb-1">{title}</p>
          <p className="text-slate-200 font-normal">{description}</p>
          <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900" />
        </div>
      )}
    </div>
  );
}

function LineChartCard({
  title,
  tooltipTitle,
  tooltipDesc,
  yTitle,
  data,
  y1Key,
  y1Label,
  y2Key,
  y2Label,
  yMin = 0,
  yMax = 1,
}: {
  title: string;
  tooltipTitle: string;
  tooltipDesc: string;
  yTitle: string;
  data: EpochMetric[];
  y1Key: keyof EpochMetric;
  y1Label: string;
  y2Key: keyof EpochMetric;
  y2Label: string;
  yMin?: number;
  yMax?: number;
}) {
  const width = 360;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxEpoch = Math.max(1, ...data.map((d) => d.epoch));

  const getX = (epoch: number) => paddingLeft + ((epoch - 1) / Math.max(1, maxEpoch - 1)) * chartW;
  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin || 1);
    return paddingTop + chartH - ratio * chartH;
  };

  const points1 = data.map((d) => `${getX(d.epoch)},${getY(d[y1Key] ?? 0)}`).join(" ");
  const points2 = data.map((d) => `${getX(d.epoch)},${getY(d[y2Key] ?? 0)}`).join(" ");

  // Y-axis ticks
  const step = (yMax - yMin) / 4 || 0.25;
  const yTicks = [yMin, yMin + step, yMin + 2 * step, yMin + 3 * step, yMax];

  // X-axis ticks
  const xTicks = Array.from(new Set([0, 10, 20, 30, 40, maxEpoch]))
    .filter((v) => v <= maxEpoch)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-2 border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <InfoTooltip title={tooltipTitle} description={tooltipDesc} />
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
            <span className="text-gray-700">— {y1Label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-600 inline-block"></span>
            <span className="text-gray-700">— {y2Label}</span>
          </div>
        </div>
      </div>

      <div className="relative border border-gray-200 rounded-xl bg-white p-3 shadow-2xs overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={`y-grid-${i}`}
              x1={paddingLeft}
              y1={getY(tick)}
              x2={width - paddingRight}
              y2={getY(tick)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}

          {/* Y Axis Labels */}
          {yTicks.map((tick, i) => (
            <text
              key={`y-label-${i}`}
              x={paddingLeft - 6}
              y={getY(tick) + 3}
              fontSize="9"
              fill="#64748b"
              textAnchor="end"
            >
              {tick < 1 ? tick.toFixed(1) : Math.round(tick)}
            </text>
          ))}

          {/* X Axis Labels */}
          {xTicks.map((epoch, idx) => (
            <text
              key={`x-label-${epoch}-${idx}`}
              x={epoch === 0 ? paddingLeft : getX(epoch)}
              y={height - paddingBottom + 14}
              fontSize="9"
              fill="#64748b"
              textAnchor="middle"
            >
              {epoch}
            </text>
          ))}

          {/* X Axis Title */}
          <text
            x={paddingLeft + chartW / 2}
            y={height - 2}
            fontSize="10"
            fontWeight="bold"
            fill="#1e293b"
            textAnchor="middle"
          >
            Epochs
          </text>

          {/* Y Axis Title */}
          <text
            x={-(paddingTop + chartH / 2)}
            y="12"
            transform="rotate(-90)"
            fontSize="10"
            fontWeight="bold"
            fill="#1e293b"
            textAnchor="middle"
          >
            {yTitle}
          </text>

          {/* Line 1 (Train) */}
          <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points1} />

          {/* Line 2 (Val/Test) */}
          <polyline fill="none" stroke="#d97706" strokeWidth="2" points={points2} />
        </svg>
      </div>
    </div>
  );
}
