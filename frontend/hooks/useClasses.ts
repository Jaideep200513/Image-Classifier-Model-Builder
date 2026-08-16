"use client";

import { useState, useCallback } from "react";
import { ImageClass } from "@/types";

// Palette of soft colors for class cards
const CLASS_COLORS = [
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#f97316",
  "#ec4899",
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
