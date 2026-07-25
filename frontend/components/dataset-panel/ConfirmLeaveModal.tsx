"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting?: boolean;
}

export default function ConfirmLeaveModal({
  isOpen,
  onClose,
  onConfirm,
  isResetting = false,
}: ConfirmLeaveModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl overflow-hidden"
          style={{ borderColor: "#e2e5f0" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isResetting}
            className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header icon */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Are you sure you want to go back?</h3>
              <p className="text-xs text-muted-foreground">Confirm data erasure</p>
            </div>
          </div>

          {/* Body */}
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-900 leading-relaxed">
            Going back to <span className="font-semibold">New Project</span> will permanently erase all uploaded image samples, webcam captures, and custom dataset classes.
          </div>

          {/* Footer buttons */}
          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isResetting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              disabled={isResetting}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isResetting ? "Erasing Data..." : "Erase Data & Leave"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
