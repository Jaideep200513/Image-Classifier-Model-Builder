"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import ProjectCard from "@/components/project-card/ProjectCard";
import SpotlightCard from "@/components/bits/SpotlightCard";
import { motion } from "motion/react";
import { Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    const toastId = toast.loading(`Importing "${file.name}"...`);

    try {
      const importedProj = await api.importTmProject("default-project", file);
      await queryClient.invalidateQueries({ queryKey: ["project", "default-project"] });

      const totalImages = importedProj.classes.reduce(
        (acc, c) => acc + (c.images?.length || c.imageCount || 0),
        0
      );
      toast.success(
        `Project "${importedProj.name}" imported with ${importedProj.classes.length} classes and ${totalImages} samples!`,
        { id: toastId }
      );

      router.push("/workspace");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to import .tm project file", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground">
      {/* Floating Navbar */}
      <Navbar />

      <main className="flex flex-1 flex-col px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".tm,.json,.zip"
            className="hidden"
            id="import-tm-file-input"
          />

          {/* Page heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-1.5"
          >
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "#000000" }}>
              New <span className="font-display font-light italic" style={{ color: "#5f79ff" }}>Project</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            className="mb-4 text-base"
            style={{ color: "#4d4d4d" }}
          >
            Select a project type or open an existing project file.
          </motion.p>

          {/* Action Pills Section matching Teachable Machine design */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.12 }}
            className="mb-6 flex flex-wrap items-center gap-3"
          >
            {/* Open from File */}
            <button
              onClick={handleFileButtonClick}
              disabled={isUploading}
              type="button"
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 transition-all cursor-pointer"
              id="open-from-file-btn"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              ) : (
                <Folder className="h-4 w-4 text-slate-700 stroke-[1.75]" />
              )}
              <span>Open an existing project from a file.</span>
            </button>
          </motion.div>

          {/* Project Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.16 }}
            className="max-w-sm"
          >
            <ProjectCard />
          </motion.div>

          {/* More coming soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.24 }}
            className="mt-8"
          >
            <SpotlightCard
              className="rounded-2xl border-2 border-dashed p-6 bg-white"
              style={{ borderColor: "#d9defc" }}
              spotlightColor="rgba(95, 121, 255, 0.05)"
            >
              <p className="mb-1.5 text-sm font-semibold" style={{ color: "#5f79ff" }}>
                More coming soon
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#4d4d4d" }}>
                More models will appear here as they&apos;re developed.
              </p>
            </SpotlightCard>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#ffffff" }} className="py-8 mt-auto">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9c9c9c" }}>
              © {new Date().getFullYear()} ModelForge. Internal use only.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9c9c9c" }}>
              ModelForge Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

