"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import {
  History,
  Search,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  List,
  Check,
  Grid2X2,
  Grid3X3,
  ArrowUpDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api";
import { ProjectHistoryItem } from "@/types";
import { toast } from "sonner";

type SortOption = "none" | "newest" | "oldest" | "name-asc" | "accuracy" | "samples" | "trained" | "untrained";
type ViewMode = "grid-lg" | "grid-md" | "list";

export default function HistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [viewMode, setViewMode] = useState<ViewMode>("grid-lg");

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (viewRef.current && !viewRef.current.contains(event.target as Node)) {
        setIsViewOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: projects = [], isLoading, refetch } = useQuery<ProjectHistoryItem[]>({
    queryKey: ["allProjectsHistory"],
    queryFn: () => api.getAllProjects(),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["allProjectsHistory"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete project");
    },
  });

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

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "none") return 0;
    if (sortBy === "newest") {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "accuracy") {
      const accA = a.metrics?.val_accuracy ?? -1;
      const accB = b.metrics?.val_accuracy ?? -1;
      return accB - accA;
    }
    if (sortBy === "samples") {
      return b.total_images_count - a.total_images_count;
    }
    if (sortBy === "trained") {
      return (b.has_trained_model ? 1 : 0) - (a.has_trained_model ? 1 : 0);
    }
    if (sortBy === "untrained") {
      return (a.has_trained_model ? 1 : 0) - (b.has_trained_model ? 1 : 0);
    }
    return 0;
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
    router.push(`/workspace?projectId=${projectId}`);
  };

  const handleViewDetails = (projectId: string) => {
    router.push(`/history/${projectId}`);
  };

  const SORT_LABELS: Record<SortOption, string> = {
    none: "None (Default Order)",
    newest: "Newest First",
    oldest: "Oldest First",
    trained: "Trained First",
    untrained: "Un-trained First",
    accuracy: "Highest Accuracy",
    "name-asc": "Name (A to Z)",
    samples: "Most Image Samples",
  };




  const VIEW_LABELS: Record<ViewMode, { label: string; icon: React.ReactNode }> = {
    "grid-lg": { label: "Large Icons (3 Cols)", icon: <Grid3X3 className="h-4 w-4" /> },
    "grid-md": { label: "Medium Icons (2 Cols)", icon: <Grid2X2 className="h-4 w-4" /> },
    list: { label: "Details List", icon: <List className="h-4 w-4" /> },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground">
      {/* Floating Navbar */}
      <Navbar />

      <main className="flex flex-1 flex-col px-4 pt-32 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Page Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl flex items-center gap-3" style={{ color: "#000000" }}>
              Project <span className="font-display font-light italic" style={{ color: "#5f79ff" }}>History</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-700">
                {projects.length} Saved Projects
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse all your saved classification projects, model metrics, and dataset summaries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>

            <Link href="/new-project">
              <button className="btn-violet flex items-center gap-1.5 text-xs px-4 py-2">
                <Plus className="h-4 w-4" /> New Project
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Toolbar: Search, Sort & View Dropdowns (Explorer Style) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-200"
        >
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project name, ID, class name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-white rounded-xl border border-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Control Dropdowns */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 shadow-2xs transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-violet-600" />
                <span>Sort</span>
                <span className="text-gray-400 font-normal hidden md:inline">({SORT_LABELS[sortBy]})</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1" />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 w-52 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 space-y-0.5"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Sort Projects By
                    </div>
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSortBy(key);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                          sortBy === key
                            ? "bg-violet-50 text-violet-700 font-bold"
                            : "text-gray-700 hover:bg-gray-100 font-medium"
                        }`}
                      >
                        <span>{SORT_LABELS[key]}</span>
                        {sortBy === key && <Check className="h-3.5 w-3.5 text-violet-600" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200" />

            {/* View Dropdown */}
            <div className="relative" ref={viewRef}>
              <button
                onClick={() => setIsViewOpen(!isViewOpen)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 shadow-2xs transition-colors"
              >
                {VIEW_LABELS[viewMode].icon}
                <span>View</span>
                <span className="text-gray-400 font-normal hidden md:inline">({VIEW_LABELS[viewMode].label.split(" ")[0]})</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1" />
              </button>

              <AnimatePresence>
                {isViewOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 space-y-0.5"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Layout Display Mode
                    </div>
                    {(Object.keys(VIEW_LABELS) as ViewMode[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setViewMode(key);
                          setIsViewOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                          viewMode === key
                            ? "bg-violet-50 text-violet-700 font-bold"
                            : "text-gray-700 hover:bg-gray-100 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {VIEW_LABELS[key].icon}
                          <span>{VIEW_LABELS[key].label}</span>
                        </div>
                        {viewMode === key && <Check className="h-3.5 w-3.5 text-violet-600" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Projects Display Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.16 }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin mb-3 text-violet-600" />
              <span className="text-sm font-medium">Loading project history...</span>
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-24 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <History className="h-12 w-12 mx-auto mb-3 text-violet-400 opacity-60" />
              <h3 className="text-base font-bold text-gray-800">No projects found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? "No projects match your search query. Try adjusting your filter." : "Create a new project with image samples to get started."}
              </p>
              <Link href="/new-project" className="mt-4 inline-block">
                <button className="btn-violet text-xs px-4 py-2">
                  Create New Project
                </button>
              </Link>
            </div>
          ) : viewMode === "list" ? (
            /* ── Details List View (Table Mode) ── */
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Project Name</th>
                      <th className="px-6 py-3.5">Status / Accuracy</th>
                      <th className="px-6 py-3.5">Created Date</th>
                      <th className="px-6 py-3.5">Classes</th>
                      <th className="px-6 py-3.5">Samples</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedProjects.map((p) => {
                      const created = formatDateTime(p.created_at);
                      const valAcc = p.metrics?.val_accuracy != null ? (p.metrics.val_accuracy * 100).toFixed(1) : null;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => handleViewDetails(p.id)}
                          className="hover:bg-violet-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                            {p.name}
                            <span className="block text-[11px] font-mono font-normal text-gray-400 mt-0.5">
                              ID: {p.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {p.has_trained_model ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                {valAcc ? `${valAcc}% Acc` : "Trained"}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-500 px-2.5 py-0.5 rounded-full bg-gray-100">
                                Untrained
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {created.date} {created.time}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {p.classes_count}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {p.total_images_count}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(p.id);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-100 rounded-lg transition-colors flex items-center gap-1"
                              >
                                Details <ArrowRight className="h-3 w-3" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWorkspace(p.id);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                              >
                                Workspace <ExternalLink className="h-3 w-3 text-gray-500" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete project "${p.name}" permanently?`)) {
                                    deleteProjectMutation.mutate(p.id);
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete project"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Cards Grid View (Large 3-Cols or Medium 2-Cols Mode) ── */
            <div
              className={`grid gap-6 ${
                viewMode === "grid-lg"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 md:grid-cols-2"
              }`}
            >
              {sortedProjects.map((p) => {
                const created = formatDateTime(p.created_at);
                const valAcc = p.metrics?.val_accuracy != null ? (p.metrics.val_accuracy * 100).toFixed(1) : null;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleViewDetails(p.id)}
                    className="bg-white border border-gray-200 hover:border-violet-300 hover:shadow-lg rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                  >
                    <div>
                      {/* Top row: Name & Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors truncate flex-1">
                          {p.name}
                        </h2>

                        {p.has_trained_model ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {valAcc ? `${valAcc}% Acc` : "Trained"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                            Untrained
                          </span>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {created.date}
                        </span>
                        {created.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {created.time}
                          </span>
                        )}
                      </div>

                      {/* Dataset Counters */}
                      <div className="flex items-center gap-3 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                        <div>
                          <span className="font-bold text-gray-900">{p.classes_count}</span>
                          <span className="text-gray-500 ml-1">Classes</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div>
                          <span className="font-bold text-gray-900">{p.total_images_count}</span>
                          <span className="text-gray-500 ml-1">Image Samples</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(p.id);
                        }}
                        className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
                      >
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWorkspace(p.id);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                          title="Open in Workspace"
                        >
                          Workspace <ExternalLink className="h-3 w-3 text-gray-500" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${p.name}" permanently?`)) {
                              deleteProjectMutation.mutate(p.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
