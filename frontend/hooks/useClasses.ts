"use client";

import { useState, useCallback } from "react";
import { ImageClass } from "@/types";

// Palette of soft colors for class cards
const CLASS_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

const DEFAULT_CLASSES: ImageClass[] = [
  { id: "class-1", name: "Class 1", imageCount: 0, color: CLASS_COLORS[0] },
  { id: "class-2", name: "Class 2", imageCount: 0, color: CLASS_COLORS[1] },
];

let classCounter = 3;

function generateId(): string {
  return `class-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useClasses() {
  const [classes, setClasses] = useState<ImageClass[]>(DEFAULT_CLASSES);

  const addClass = useCallback(() => {
    const newClass: ImageClass = {
      id: generateId(),
      name: `Class ${classCounter++}`,
      imageCount: 0,
      color: CLASS_COLORS[(classCounter - 1) % CLASS_COLORS.length],
    };
    setClasses((prev) => [...prev, newClass]);
  }, []);

  const removeClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const renameClass = useCallback((id: string, name: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  }, []);

  const toggleClassDisabled = useCallback((id: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, disabled: !c.disabled } : c))
    );
  }, []);

  return { classes, addClass, removeClass, renameClass, toggleClassDisabled };
}
