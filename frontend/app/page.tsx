import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";

export const metadata: Metadata = {
  title: "ModelForge — Train Image Classifiers Visually",
  description:
    "ModelForge is a fast, internal platform to build and export custom image classifiers using your own datasets. No ML expertise required.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#ffffff" }} className="py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9c9c9c" }}>
              © {new Date().getFullYear()} ModelForge. Internal use only.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9c9c9c" }}>
              Phase 1 — Frontend Preview
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
