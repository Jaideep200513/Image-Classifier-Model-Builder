"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Info, X, Edit2, Check, Layers, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ProjectStats } from "@/types";
import { toast } from "sonner";

const DEFAULT_PROJECT_ID = "default-project";

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onProjectUpdated?: () => void;
}

export default function ProjectInfoModal({
  isOpen,
  onClose,
  projectId = DEFAULT_PROJECT_ID,
  onProjectUpdated,
}: ProjectInfoModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const statsQuery = useQuery<ProjectStats, Error>({
    queryKey: ["projectStats", projectId],
    queryFn: () => api.getProjectInfo(projectId),
    enabled: isOpen,
    staleTime: 2000,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const statsName = statsQuery.data?.name;
  const statsDesc = statsQuery.data?.description;

  useEffect(() => {
    if (statsName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(statsName);
      setDescription(statsDesc || "");
    }
  }, [statsName, statsDesc]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.updateProject(projectId, data),
    onSuccess: () => {
      toast.success("Project updated successfully");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["projectStats", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      if (onProjectUpdated) onProjectUpdated();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update project");
    },
  });

  if (!isOpen) return null;

  const stats = statsQuery.data || {
    id: projectId,
    name: "Image Project",
    description: "Custom Image Classification Project",
    classes_count: 0,
    images_count: 0,
    has_model: false,
  };

  function handleSaveRename() {
    if (!name.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    updateMutation.mutate({ name: name.trim(), description: description.trim() });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl overflow-hidden flex flex-col"
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Project Information</h3>
              <p className="text-xs text-muted-foreground">Manage details and view stats</p>
            </div>
          </div>

          {/* Body */}
          <div className="mt-5 space-y-4">

            {/* Editable Project Name */}
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Project Name
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs font-semibold"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveRename}
                    disabled={updateMutation.isPending}
                    className="btn-purple text-xs h-8 px-2.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{stats.name}</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-slate-200/60 rounded transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 p-3 bg-white flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Dataset Classes</p>
                  <p className="text-xs font-bold text-foreground">{stats.classes_count} Classes</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-white flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total Samples</p>
                  <p className="text-xs font-bold text-foreground">{stats.images_count} Images</p>
                </div>
              </div>
            </div>

            {/* Model Status */}
            <div className="rounded-xl border border-slate-200 p-3 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {stats.has_model ? "Trained Model Active" : "No Model Trained"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {stats.trained_at ? `Last trained: ${stats.trained_at}` : "MobileNetV2 Transfer Learning"}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  stats.has_model
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {stats.has_model ? "Ready" : "Idle"}
              </span>
            </div>

          </div>

          {/* Footer */}
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
