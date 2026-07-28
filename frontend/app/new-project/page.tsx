"use client";

import Navbar from "@/components/navbar/Navbar";
import ProjectCard from "@/components/project-card/ProjectCard";
import SpotlightCard from "@/components/bits/SpotlightCard";
import { motion } from "motion/react";

export default function NewProjectPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground">
      {/* Floating Navbar */}
      <Navbar />

      <main className="flex flex-1 flex-col px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          {/* Page heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-2"
          >
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "#000000" }}>
              New <span className="font-display font-light italic" style={{ color: "#5f79ff" }}>Project</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            className="mb-8 text-base"
            style={{ color: "#4d4d4d" }}
          >
            Select a project type to get started.
          </motion.p>

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
