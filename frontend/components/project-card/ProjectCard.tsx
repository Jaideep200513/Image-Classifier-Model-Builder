"use client";

import Link from "next/link";
import { ImageIcon, ArrowRight } from "lucide-react";
import SpotlightCard from "@/components/bits/SpotlightCard";

const SAMPLE_GRADIENTS = [
  { from: "#5f79ff", to: "#9bb0ff" },
  { from: "#01fe93", to: "#5f79ff" },
  { from: "#d9defc", to: "#5f79ff" },
];

export default function ProjectCard() {
  return (
    <Link href="/workspace" className="block group focus:outline-none" id="create-project-card">
      <div
        className="relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer bg-white"
        style={{ borderColor: "#e5e7eb", borderRadius: "16px" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#5f79ff";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(95, 121, 255, 0.12)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "";
          (e.currentTarget as HTMLDivElement).style.transform = "";
        }}
      >
        {/* Sample Gradients Strip */}
        <div className="flex h-36 overflow-hidden">
          {SAMPLE_GRADIENTS.map((g, i) => (
            <div
              key={i}
              className="flex-1 transition-transform duration-500 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
            />
          ))}
        </div>

        {/* Card Body with Spotlight */}
        <SpotlightCard className="rounded-none bg-white p-6" spotlightColor="rgba(95, 121, 255, 0.08)">
          <div className="mb-4 flex items-center justify-between">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#d9defc" }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: "#5f79ff" }} />
            </div>
            <span
              className="rounded-full px-3 py-0.5 text-xs font-medium border"
              style={{
                backgroundColor: "#f5f5f5",
                borderColor: "#e5e7eb",
                color: "#5f79ff",
              }}
            >
              Phase 2 — Active
            </span>
          </div>

          <h2 className="mb-2 text-xl font-semibold" style={{ color: "#000000" }}>
            Image Project
          </h2>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "#4d4d4d" }}>
            Train a custom image classifier using uploaded datasets or live webcam samples. Supports fast browser preview.
          </p>

          <button
            className="btn-violet w-full flex items-center justify-center gap-2 text-sm"
            id="create-project-btn"
          >
            Create Project
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </SpotlightCard>
      </div>
    </Link>
  );
}
