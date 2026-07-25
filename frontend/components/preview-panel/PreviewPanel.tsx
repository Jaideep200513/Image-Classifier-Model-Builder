"use client";

import { useState } from "react";
import { Camera, Upload, Eye, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { InputSource, PredictionResult } from "@/types";

const MOCK_PREDICTIONS: PredictionResult[] = [
  { classId: "class-1", className: "Class 1", confidence: 100, color: "bg-primary" },
  { classId: "class-2", className: "Class 2", confidence: 0,   color: "bg-emerald-400" },
  { classId: "class-3", className: "Class 3", confidence: 0,   color: "bg-violet-400" },
];

const INPUT_SOURCES: { value: InputSource; label: string }[] = [
  { value: "webcam", label: "Webcam" },
  { value: "upload", label: "Upload" },
];

export default function PreviewPanel() {
  const [inputSource, setInputSource] = useState<InputSource>("webcam");
  const [inputOn, setInputOn] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden"
      style={{ borderColor: "#e2e5f0" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#dde2f5" }}>
            <Eye className="h-3.5 w-3.5" style={{ color: "#3d0099" }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "#1a1a2e" }}>Preview</span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold border"
          style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#c2410c" }}
        >
          Phase 2
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-4 space-y-4">

        {/* Input row — "Input [toggle] ON | Webcam ∨" */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground flex-shrink-0">Input</span>

          {/* On/Off toggle */}
          <button
            onClick={() => setInputOn((v) => !v)}
            className={cn(
              "relative flex h-5 w-9 flex-shrink-0 items-center rounded-full border-2 transition-colors duration-200",
              inputOn ? "border-primary bg-primary" : "border-border bg-muted"
            )}
            aria-label="Toggle input"
            id="input-toggle-btn"
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "absolute h-3 w-3 rounded-full bg-white shadow",
                inputOn ? "left-[18px]" : "left-[2px]"
              )}
            />
          </button>
          <span className="text-xs font-semibold text-foreground">{inputOn ? "ON" : "OFF"}</span>

          {/* Source selector */}
          <div className="flex-1" />
          <div className="relative">
            <select
              value={inputSource}
              onChange={(e) => setInputSource(e.target.value as InputSource)}
              className="appearance-none rounded-lg border border-border bg-muted/40 py-1 pl-3 pr-7 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              id="input-source-select"
            >
              {INPUT_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Webcam / Upload area */}
        <motion.div
          key={inputSource}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border-2 transition-colors",
            inputOn
              ? "border-[#3d0099]/30"
              : "border-dashed"
          )}
          style={!inputOn ? { borderColor: "#dde2f5", backgroundColor: "#f4f0ff" } : { backgroundColor: "#1a1a2e" }}
        >
          {inputSource === "webcam" ? (
            <div className="text-center text-muted-foreground">
              <div className={cn(
                "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                inputOn ? "bg-white/10" : "bg-muted"
              )}>
                <Camera className={cn("h-6 w-6", inputOn ? "text-white/60" : "text-muted-foreground/50")} />
              </div>
              <p className={cn("text-xs font-medium", inputOn ? "text-white/60" : "")}>
                {inputOn ? "Webcam ready" : "Webcam Preview"}
              </p>
              <p className={cn("text-xs mt-0.5", inputOn ? "text-white/40" : "text-muted-foreground/60")}>
                {inputOn ? "Phase 2 — inference pending" : "Available in Phase 2"}
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-xs font-medium">Drop image here</p>
              <p className="text-xs mt-0.5 opacity-60">Available in Phase 2</p>
            </div>
          )}

          {/* Corner icons (like TM) */}
          {inputOn && (
            <>
              <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded border border-white/20 text-white/40">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 4V1h3M6 1h3v3M9 6v3H6M4 9H1V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border border-white/20 text-white/40">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 1h2V3H2zM5 1h3v2H5zM2 5h2v2H2zM5 5h3v2H5z" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
            </>
          )}
        </motion.div>

        {/* Down arrow */}
        <div className="flex justify-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted/60">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M2 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" />
            </svg>
          </div>
        </div>

        {/* ── Output ── horizontal bars (matches reference) */}
        <div>
          <p className="mb-3 text-xs font-bold text-foreground uppercase tracking-wider">Output</p>
          <div className="space-y-2">
            {MOCK_PREDICTIONS.map((p, i) => (
              <OutputBar key={p.classId} prediction={p} index={i} />
            ))}
          </div>
        </div>

        {/* Note */}
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          Placeholder data · Real inference in Phase 2
        </p>
      </div>
    </motion.div>
  );
}

// ── Horizontal output bar ────────────────────────────────────────────────────

const BAR_COLORS: Record<string, { bg: string; text: string }> = {
  "bg-primary":      { bg: "bg-[#3d0099]",        text: "text-[#3d0099]" },
  "bg-emerald-400":  { bg: "bg-emerald-400",       text: "text-emerald-600" },
  "bg-violet-400":   { bg: "bg-violet-400",        text: "text-violet-600" },
};

function OutputBar({ prediction, index }: { prediction: PredictionResult; index: number }) {
  const colorSet = BAR_COLORS[prediction.color] ?? { bg: "bg-muted-foreground/40", text: "text-muted-foreground" };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex items-center gap-2"
    >
      {/* Class name */}
      <span className={cn("w-14 flex-shrink-0 text-xs font-semibold truncate", colorSet.text)}>
        {prediction.className}
      </span>

      {/* Bar track */}
      <div className="relative flex-1 h-6 overflow-hidden rounded-md bg-muted/60">
        <motion.div
          className={cn("absolute left-0 top-0 h-full rounded-md", colorSet.bg)}
          initial={{ width: 0 }}
          animate={{ width: `${prediction.confidence}%` }}
          transition={{ duration: 0.75, delay: 0.25 + index * 0.1, ease: [0.34, 1.2, 0.64, 1] }}
        />
        {/* Percentage inside bar */}
        {prediction.confidence > 15 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white tabular-nums"
          >
            {prediction.confidence}%
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
