"use client";

import { useRouter } from "next/navigation";
import { ImageIcon, ArrowRight } from "lucide-react";
import SpotlightCard from "@/components/bits/SpotlightCard";
import { api } from "@/lib/api";



export default function ProjectCard() {
  const router = useRouter();

  async function handleCreateProject(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const newProj = await api.createProject("Image Project");
      router.push(`/workspace?projectId=${newProj.id}`);
    } catch {
      router.push("/workspace");
    }
  }

  return (
    <div
      onClick={handleCreateProject}
      className="block group focus:outline-none"
      id="create-project-card"
    >
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
        {/* Sample Class Drawings Header */}
        <div className="grid grid-cols-3 h-32 border-b border-slate-100 overflow-hidden bg-[#f9f8f6]">
          {[
            { name: "Cat", src: "/cat-sample.png", bg: "#f5f2eb" },
            { name: "Dog", src: "/dog-sample.png", bg: "#f9f8f6" },
            { name: "Bird", src: "/bird-sample.png", bg: "#ffffff" },
          ].map((item, i) => (
            <div
              key={i}
              className="relative flex items-center justify-center p-2.5 border-r last:border-r-0 border-slate-200/60 overflow-hidden"
              style={{ backgroundColor: item.bg }}
            >
              <img
                src={item.src}
                alt={`${item.name} Sample`}
                className="h-full w-full object-contain mix-blend-multiply select-none transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 bg-white/80 rounded border border-slate-200/80 backdrop-blur-xs">
                {item.name}
              </span>
            </div>
          ))}
        </div>

        {/* Card Body with Spotlight */}
        <SpotlightCard className="rounded-none bg-white p-5" spotlightColor="rgba(95, 121, 255, 0.08)">
          <div className="mb-3.5 flex items-center justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#d9defc" }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: "#5f79ff" }} />
            </div>
          </div>

          <h2 className="mb-1.5 text-xl font-semibold" style={{ color: "#000000" }}>
            Image Project
          </h2>
          <p className="mb-4.5 text-sm leading-relaxed" style={{ color: "#4d4d4d" }}>
            Train a custom image classifier using uploaded datasets or live webcam samples. Supports fast browser preview.
          </p>

          <button
            className="btn-violet w-full flex items-center justify-center gap-2 text-sm cursor-pointer"
            id="create-project-btn"
          >
            Create Project
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </SpotlightCard>
      </div>
    </div>
  );
}
